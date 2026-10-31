import { createStore } from "../../state/store";
import { settingsStore, setSetting, type AudioMode, type RepeatMode } from "../../state/settings";
import { Storage } from "../storage/Storage";
import { QuranRepository, type SurahText } from "../quran/QuranRepository";
import { QuranAudioRepository, type SurahTrack, type Track } from "../quran/QuranAudioRepository";
import { effectiveMode, reciter as reciterMeta, surah as surahMeta } from "../quran/QuranMetadata";
import { BookmarkService } from "../bookmarks/BookmarkService";
import { onNetwork, onVisibility } from "../../platform/lifecycle/lifecycle";
import type { AudioEngine, EngineError, EngineName } from "./AudioEngine";
import { HTML5AudioEngine } from "./HTML5AudioEngine";
import { TizenAVPlayEngine } from "./TizenAVPlayEngine";

/** A whole athkar recording (morning or evening) played through the same player as the Quran. */
export interface AthkarTrack { kind: "morning" | "evening"; title: string; reciter: string; url: string }

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";

export interface PlayerState {
  status: PlayerStatus;
  surah: number;
  /** 0-based ayah index; -1 while the Basmala plays (prelude file, or the opening of a
   *  full-surah recording before ayah 1). */
  index: number;
  reciter: string;
  /** The audio mode actually playing (a reciter may support only one). */
  mode: AudioMode;
  text: SurahText | null;
  error: string | null;
  /** Pause-after-each-ayah: an ayah finished and the next one waits for Play. */
  awaiting: boolean;
  /** Set while an athkar recording is loaded instead of the Quran. */
  athkar: AthkarTrack | null;
}

export interface TimeState { time: number; duration: number }

/** `time` is within the surah recording (surah mode) or within the ayah file (ayah mode). */
export interface LastPosition { surah: number; ayah: number; reciter: string; time: number; mode?: AudioMode }

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

export const playerStore = createStore<PlayerState>({
  status: "idle", surah: 18, index: 0, reciter: settingsStore.get().reciter, mode: settingsStore.get().audioMode,
  text: null, error: null, awaiting: false, athkar: null,
});
/** Position updates (~4/s) live in their own store so only progress bars re-render. */
export const timeStore = createStore<TimeState>({ time: 0, duration: 0 });

/** Text is fetched with an ayah audio edition; reciters without one use Alafasy's just for text. */
function textEdition(reciterId: string): string {
  return reciterMeta(reciterId).ayah || "ar.alafasy";
}

class Manager {
  private engine: AudioEngine | null = null;
  private offs: (() => void)[] = [];
  private seq = 0;
  /** Ayah mode: the file playing. */
  private track: Track | null = null;
  /** Surah mode: the recording and its timestamps. */
  private surahTrack: SurahTrack | null = null;
  /** Athkar: the recording playing instead of the Quran. */
  private athkarTrack: AthkarTrack | null = null;
  private attempts = 0;
  private retryTimer = 0;
  private usingFallback = false;
  private resumeOnShow = false;
  private lastSave = 0;
  private lastTime = 0;

  init(): void {
    this.useEngine(settingsStore.get().engine);
    let prev = settingsStore.get();
    settingsStore.subscribe(() => {
      const s = settingsStore.get();
      if (s.engine !== prev.engine) this.switchEngine(s.engine);
      if (s.reciter !== prev.reciter || s.audioMode !== prev.audioMode) this.reloadAtCurrentAyah();
      if (s.translation !== prev.translation) this.changeTranslation(s.translation);
      prev = s;
    });
    onVisibility((visible) => {
      const st = playerStore.get().status;
      if (!visible) {
        this.resumeOnShow = st === "playing" || st === "buffering" || st === "loading";
        if (this.resumeOnShow) this.engine && this.engine.pause();
        this.save(true);
      } else if (this.resumeOnShow) {
        this.resumeOnShow = false;
        this.resume();
      }
    });
    onNetwork((online) => {
      if (online && this.retryTimer) {
        window.clearTimeout(this.retryTimer);
        this.retryTimer = 0;
        this.retry();
      }
    });
  }

  // ---------------------------------------------------------------- engines
  private useEngine(name: EngineName): void {
    const engine: AudioEngine = name === "avplay" && TizenAVPlayEngine.available() ? new TizenAVPlayEngine() : new HTML5AudioEngine();
    this.engine = engine;
    this.offs = [
      engine.on("playing", () => {
        this.attempts = 0;
        playerStore.set({ status: "playing", error: null, awaiting: false });
      }),
      engine.on("paused", () => {
        const s = playerStore.get().status;
        if (s === "playing" || s === "buffering") playerStore.set({ status: "paused" });
      }),
      engine.on("waiting", () => {
        if (playerStore.get().status === "playing") playerStore.set({ status: "buffering" });
      }),
      engine.on("time", (t) => this.onTime(t as number)),
      engine.on("duration", (d) => timeStore.set({ duration: (d as number) || 0 })),
      engine.on("ended", () => this.onEnded()),
      engine.on("error", (e) => this.onError(e as EngineError)),
    ];
  }

  private switchEngine(name: EngineName): void {
    const st = playerStore.get();
    const t = this.engine ? this.engine.time() : 0;
    const wasPlaying = st.status === "playing" || st.status === "buffering";
    this.offs.forEach((f) => f());
    if (this.engine) this.engine.destroy();
    this.useEngine(name);
    if (this.athkarTrack) this.loadUrl(this.athkarTrack.url, wasPlaying, t);
    else if (st.mode === "surah" && this.surahTrack) this.loadUrl(this.surahTrack.url, wasPlaying, t);
    else if (st.text && this.track) this.loadTrack(this.track, wasPlaying, t);
  }

  activeEngine(): EngineName {
    return this.engine ? this.engine.name : "html5";
  }

  // ---------------------------------------------------------------- start
  /**
   * Play a surah from an ayah (1-based). `startAt` is a position saved by this app: within the
   * surah recording in surah mode, within the ayah file in ayah mode (`mode` says which).
   */
  async play(surah: number, ayah = 1, opts: { autoplay?: boolean; startAt?: number; mode?: AudioMode } = {}): Promise<void> {
    const seq = ++this.seq;
    const s = settingsStore.get();
    const r = reciterMeta(s.reciter);
    let mode = effectiveMode(r, s.audioMode);
    const autoplay = opts.autoplay !== false;
    const startAt = opts.mode && opts.mode === mode ? opts.startAt || 0 : 0;
    window.clearTimeout(this.retryTimer);
    this.retryTimer = 0;
    this.athkarTrack = null;
    playerStore.set({ surah, index: ayah - 1, reciter: s.reciter, mode, status: autoplay ? "loading" : "paused", error: null, awaiting: false, athkar: null });
    timeStore.set({ time: 0, duration: 0 });

    let text: SurahText;
    try {
      text = await QuranRepository.getSurah(surah, s.translation, textEdition(s.reciter));
    } catch {
      if (seq === this.seq) playerStore.set({ status: "error", error: "Couldn't load this surah. Check the connection and try again." });
      return;
    }
    if (seq !== this.seq) return;
    playerStore.set({ text });
    BookmarkService.addRecent({ surah, ayah, reciter: s.reciter });

    if (mode === "surah" && r.qdc) {
      try {
        const track = await QuranAudioRepository.surahTrack(r.qdc, surah);
        if (seq !== this.seq) return;
        this.track = null;
        this.surahTrack = track;
        const at = startAt || (ayah > 1 ? track.ayahs[ayah - 1].from : 0);
        this.lastTime = at;
        playerStore.set({ index: QuranAudioRepository.ayahAt(track, at) });
        timeStore.set({ time: at });
        this.attempts = 0;
        this.loadUrl(track.url, autoplay, at);
        this.save(true);
        return;
      } catch {
        if (seq !== this.seq) return;
        if (!r.ayah) { playerStore.set({ status: "error", error: "Couldn't load this recitation. Check the connection and try again." }); return; }
        mode = "ayah";   // no timed recording reachable: fall back to one file per ayah
        playerStore.set({ mode });
      }
    }

    this.surahTrack = null;
    const index = ayah === 1 && !startAt && s.basmala && QuranAudioRepository.hasBasmalaPrelude(surah) ? -1 : ayah - 1;
    await this.playIndex(index, autoplay, startAt, seq);
  }

  /** Play a morning / evening athkar recording; the Quran position stays saved for later. */
  playAthkar(track: AthkarTrack): void {
    ++this.seq;
    window.clearTimeout(this.retryTimer);
    this.retryTimer = 0;
    this.save(true);
    this.track = null;
    this.surahTrack = null;
    this.athkarTrack = track;
    this.attempts = 0;
    playerStore.set({ athkar: track, status: "loading", error: null, awaiting: false });
    timeStore.set({ time: 0, duration: 0 });
    this.loadUrl(track.url, true, 0);
  }

  /** Back to the Quran where it was left (after athkar), or just resume it. */
  resumeQuran(): void {
    if (!this.athkarTrack) { this.resume(); return; }
    const last = this.lastPosition();
    const st = playerStore.get();
    if (last) this.play(last.surah, Math.max(1, last.ayah), { startAt: last.time || 0, mode: last.mode || "ayah" });
    else this.play(st.surah, Math.max(1, st.index + 1));
  }

  /** Ayah mode: load one ayah's file (or the Basmala prelude at index -1). */
  private async playIndex(index: number, autoplay: boolean, startAt = 0, seq = this.seq): Promise<void> {
    const st = playerStore.get();
    if (!st.text) return;
    const track = index < 0 ? await QuranAudioRepository.basmalaTrack(textEdition(st.reciter)) : QuranAudioRepository.ayahTrack(st.text, index);
    if (seq !== this.seq) return;
    if (!track) {
      if (index < 0) return this.playIndex(0, autoplay, 0, seq);   // no Basmala recording: start at ayah 1
      playerStore.set({ status: "error", error: "No recitation audio for this ayah." });
      return;
    }
    playerStore.set({ index, status: autoplay ? "loading" : "paused", awaiting: false });
    timeStore.set({ time: startAt, duration: 0 });
    this.attempts = 0;
    this.usingFallback = false;
    this.loadTrack(track, autoplay, startAt);
    this.save(true);
  }

  private loadUrl(url: string, autoplay: boolean, startAt = 0): void {
    if (this.engine) this.engine.load(url, { autoplay, startAt });
  }

  private loadTrack(track: Track, autoplay: boolean, startAt = 0): void {
    if (!this.engine) return;
    this.track = track;
    this.loadUrl(this.usingFallback && track.fallback ? track.fallback : track.url, autoplay, startAt);
    this.engine.preload(this.nextUrl());
  }

  private nextUrl(): string | null {
    const st = playerStore.get();
    if (!st.text || st.mode !== "ayah") return null;
    if (settingsStore.get().repeat === "ayah" && st.index >= 0) return null;
    const t = st.index + 1 < st.text.ayahs.length ? QuranAudioRepository.ayahTrack(st.text, st.index + 1) : null;
    return t ? t.url : null;
  }

  // ---------------------------------------------------------------- progress
  private onTime(t: number): void {
    timeStore.set({ time: t, duration: this.engine ? this.engine.duration() : 0 });
    if (this.athkarTrack) return;
    const st = playerStore.get();
    const track = this.surahTrack;
    if (st.mode === "surah" && track) {
      const idx = QuranAudioRepository.ayahAt(track, t);
      // A boundary crossed by playing on (not by a seek) is where repeat / pause act.
      const natural = idx === st.index + 1 && st.index >= 0 && t - this.lastTime < 1.5 && t >= this.lastTime;
      this.lastTime = t;
      if (idx !== st.index) {
        const s = settingsStore.get();
        if (natural && s.repeat === "ayah") { this.seekTo(track.ayahs[st.index].from); return; }
        if (natural && s.pauseEachAyah) {
          if (this.engine) this.engine.pause();
          this.seekTo(track.ayahs[idx].from);
          playerStore.set({ index: idx, status: "paused", awaiting: true });
          this.save(true);
          return;
        }
        playerStore.set({ index: idx });
        this.save(true);
      }
    }
    if (Date.now() - this.lastSave > 5000) this.save();
  }

  private onEnded(): void {
    if (this.athkarTrack) { playerStore.set({ status: "ended" }); return; }
    const st = playerStore.get();
    if (!st.text) return;
    const s = settingsStore.get();
    const repeat: RepeatMode = s.repeat;
    if (st.mode === "surah" && this.surahTrack) {
      const last = this.surahTrack.ayahs[this.surahTrack.ayahs.length - 1];
      if (repeat === "ayah") { this.seekTo(last.from); this.engine && this.engine.play(); return; }
    } else {
      const pause = s.pauseEachAyah && st.index >= 0;
      if (st.index >= 0 && repeat === "ayah") { this.playIndex(st.index, true); return; }
      if (st.index + 1 < st.text.ayahs.length) {
        this.playIndex(st.index + 1, !pause).then(() => { if (pause) playerStore.set({ awaiting: true, status: "paused" }); });
        return;
      }
    }
    // End of the surah.
    if (repeat === "surah") { this.play(st.surah, 1); return; }
    if (s.continuous && st.surah < 114) { this.play(st.surah + 1, 1); return; }
    playerStore.set({ status: "ended" });
    this.save(true);
  }

  // ---------------------------------------------------------------- errors / recovery
  private onError(err: EngineError): void {
    const st = playerStore.get();
    if (st.status === "paused") return;
    const fallback = st.mode === "ayah" && this.track ? this.track.fallback : undefined;
    if (!err.recoverable && (this.usingFallback || !fallback)) {
      playerStore.set({ status: "error", error: "This recitation file can't be played." });
      return;
    }
    if (this.attempts >= RETRY_DELAYS.length) {
      playerStore.set({ status: "error", error: "Connection lost. Playback will resume when you press Play." });
      return;
    }
    // After two failures switch to the lower-bitrate mirror (ayah files have one).
    if (this.attempts >= 2 && fallback) this.usingFallback = true;
    const delay = RETRY_DELAYS[this.attempts++];
    playerStore.set({ status: "buffering", error: null });
    window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => { this.retryTimer = 0; this.retry(); }, delay);
  }

  private retry(): void {
    const at = timeStore.get().time;
    if (this.athkarTrack) this.loadUrl(this.athkarTrack.url, true, at);
    else if (playerStore.get().mode === "surah" && this.surahTrack) this.loadUrl(this.surahTrack.url, true, at);
    else if (this.track) this.loadTrack(this.track, true, at);
  }

  // ---------------------------------------------------------------- controls
  toggle(): void {
    const st = playerStore.get().status;
    if (st === "playing" || st === "buffering" || st === "loading") this.pause();
    else this.resume();
  }

  pause(): void {
    window.clearTimeout(this.retryTimer);
    this.retryTimer = 0;
    if (this.engine) this.engine.pause();
    playerStore.set({ status: "paused" });
    this.save(true);
  }

  resume(): void {
    const st = playerStore.get();
    if (this.athkarTrack) {
      if (st.status === "ended") { this.playAthkar(this.athkarTrack); return; }
      if (st.status === "error") { this.attempts = 0; this.loadUrl(this.athkarTrack.url, true, timeStore.get().time); }
      else if (this.engine) this.engine.play();
      playerStore.set({ status: "loading" });
      return;
    }
    if (!st.text) { this.play(st.surah, Math.max(1, st.index + 1)); return; }
    if (st.status === "ended") { this.play(st.surah, 1); return; }
    const loaded = st.mode === "surah" ? !!this.surahTrack : !!this.track;
    if (st.status === "error" || !loaded) {
      this.attempts = 0;
      if (st.mode === "surah") this.play(st.surah, Math.max(1, st.index + 1), { startAt: timeStore.get().time, mode: "surah" });
      else this.playIndex(st.index, true, timeStore.get().time);
      return;
    }
    if (this.engine) this.engine.play();
    playerStore.set({ status: "loading", awaiting: false });
  }

  /** Surah mode: jump to an ayah's timestamp and keep (or start) playing. */
  private jumpTo(index: number): void {
    const track = this.surahTrack;
    if (!track) return;
    const at = index < 0 ? 0 : track.ayahs[index].from;
    this.lastTime = at;
    playerStore.set({ index, awaiting: false });
    this.seekTo(at);
    if (playerStore.get().status !== "playing" && this.engine) { this.engine.play(); playerStore.set({ status: "loading" }); }
    this.save(true);
  }

  nextAyah(): void {
    if (this.athkarTrack) { this.seekBy(15); return; }
    const st = playerStore.get();
    if (!st.text) return;
    if (st.index + 1 >= st.text.ayahs.length) { this.nextSurah(); return; }
    if (st.mode === "surah") this.jumpTo(st.index + 1);
    else this.playIndex(st.index + 1, true);
  }

  /** Back to the start of the ayah, or to the previous one if already near its start. */
  prevAyah(): void {
    if (this.athkarTrack) { this.seekBy(-15); return; }
    const st = playerStore.get();
    if (!st.text) return;
    if (st.mode === "surah" && this.surahTrack) {
      const from = st.index >= 0 ? this.surahTrack.ayahs[st.index].from : 0;
      this.jumpTo(timeStore.get().time - from > 3 || st.index <= 0 ? st.index : st.index - 1);
      return;
    }
    if (timeStore.get().time > 3 || st.index <= 0) { this.seekTo(0); if (st.status === "paused") this.resume(); return; }
    this.playIndex(st.index - 1, true);
  }

  nextSurah(): void {
    if (this.athkarTrack) return;
    const st = playerStore.get();
    if (st.surah < 114) this.play(st.surah + 1, 1);
  }

  prevSurah(): void {
    if (this.athkarTrack) return;
    const st = playerStore.get();
    if (st.surah > 1) this.play(st.surah - 1, 1);
  }

  seekTo(seconds: number): void {
    if (this.engine) this.engine.seek(seconds);
  }

  seekBy(delta: number): void {
    if (!this.engine) return;
    this.engine.seek(Math.max(0, this.engine.time() + delta));
  }

  cycleRepeat(): RepeatMode {
    const order: RepeatMode[] = ["off", "ayah", "surah"];
    const next = order[(order.indexOf(settingsStore.get().repeat) + 1) % order.length];
    setSetting("repeat", next);
    if (this.engine) this.engine.preload(this.nextUrl());
    return next;
  }

  // ---------------------------------------------------------------- reciter / mode / translation
  /** New reciter or audio mode: start the ayah on screen again with the new source. */
  private reloadAtCurrentAyah(): void {
    const st = playerStore.get();
    playerStore.set({ reciter: settingsStore.get().reciter });
    if (!st.text || this.athkarTrack) return;
    const wasPlaying = st.status === "playing" || st.status === "buffering" || st.status === "loading";
    this.play(st.surah, Math.max(1, st.index + 1), { autoplay: wasPlaying });
  }

  /** New translation: swap the text on screen without interrupting the recitation. */
  private async changeTranslation(translation: string): Promise<void> {
    const st = playerStore.get();
    if (!st.text) return;
    try {
      const text = await QuranRepository.getSurah(st.surah, translation, textEdition(st.reciter));
      if (playerStore.get().surah === st.surah) playerStore.set({ text });
    } catch { /* keep the current text */ }
  }

  // ---------------------------------------------------------------- persistence
  private save(force = false): void {
    if (this.athkarTrack) return;   // the saved position is always the Quran's
    if (!force && Date.now() - this.lastSave < 5000) return;
    this.lastSave = Date.now();
    const st = playerStore.get();
    if (!st.surah) return;
    const time = st.mode === "surah" || st.index >= 0 ? timeStore.get().time : 0;
    const pos: LastPosition = { surah: st.surah, ayah: Math.max(1, st.index + 1), reciter: st.reciter, time, mode: st.mode };
    Storage.set("last", pos);
  }

  lastPosition(): LastPosition | null {
    return Storage.get<LastPosition | null>("last", null);
  }

  /** Put the player on the last position, paused, so "Continue" is one press. */
  restore(): void {
    const last = this.lastPosition();
    const s = settingsStore.get();
    if (last && s.resumeLast && last.surah >= 1 && last.surah <= 114) {
      const ayah = Math.min(Math.max(1, last.ayah), surahMeta(last.surah).ayahs);
      this.play(last.surah, ayah, { autoplay: false, startAt: last.time || 0, mode: last.mode || "ayah" });
    } else {
      this.play(18, 1, { autoplay: false });
    }
  }
}

export const AudioManager = new Manager();
