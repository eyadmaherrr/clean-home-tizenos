/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AudioEngine, EngineError } from "./AudioEngine";
import { Emitter, type EngineEvent } from "./AudioEvents";
import { webapis, hasAVPlay } from "../../platform/tizen/device";
import { HTML5AudioEngine } from "./HTML5AudioEngine";

const EVENTS: EngineEvent[] = ["playing", "paused", "waiting", "time", "duration", "ended", "error"];

/**
 * Samsung AVPlay engine, for TVs where HTML5 Audio misbehaves. AVPlay is a single native
 * player: it plays one file at a time, so there is no look-ahead buffering (`preload` is a
 * no-op). Times are in milliseconds on the AVPlay side and seconds here.
 * Selected in Settings → Audio engine; HTML5 stays the default after testing on Tizen 6.0.
 *
 * AVPlay can't open files packaged inside the app (the athkar recordings): those play through
 * an HTML5 engine held here, so the rest of the app still sees one engine.
 */
export class TizenAVPlayEngine implements AudioEngine {
  readonly name = "avplay" as const;
  private events = new Emitter<EngineEvent>();
  private av: any;
  private wantPlay = false;
  private dur = 0;
  private pos = 0;
  private token = 0;
  private html5: HTML5AudioEngine | null = null;
  /** The current file is packaged with the app and plays through `html5`. */
  private local = false;

  static available(): boolean {
    return hasAVPlay();
  }

  constructor() {
    this.av = webapis.avplay;
  }

  private state(): string {
    try { return this.av.getState(); } catch { return "NONE"; }
  }

  private localEngine(): HTML5AudioEngine {
    if (!this.html5) {
      const h = new HTML5AudioEngine();
      EVENTS.forEach((ev) => h.on(ev, (p) => { if (this.local) this.events.emit(ev, p); }));
      this.html5 = h;
    }
    return this.html5;
  }

  load(url: string, opts: { autoplay?: boolean; startAt?: number } = {}): void {
    const token = ++this.token;
    const local = !/^https?:/i.test(url);
    if (local) {
      try { this.av.stop(); } catch { /* idle */ }
      this.local = true;
      this.localEngine().load(url, opts);
      return;
    }
    if (this.local && this.html5) this.html5.stop();
    this.local = false;
    this.wantPlay = opts.autoplay !== false;
    this.pos = 0;
    this.dur = 0;
    try { this.av.stop(); } catch { /* idle */ }
    try { this.av.close(); } catch { /* idle */ }
    try {
      this.av.open(url);
      this.av.setListener({
        onbufferingstart: () => { if (token === this.token) this.events.emit("waiting"); },
        onbufferingcomplete: () => { if (token === this.token && this.wantPlay) this.events.emit("playing"); },
        oncurrentplaytime: (ms: number) => { if (token === this.token) { this.pos = ms / 1000; this.events.emit("time", this.pos); } },
        onstreamcompleted: () => { if (token === this.token) this.events.emit("ended"); },
        onerror: (type: string) => {
          if (token !== this.token) return;
          const err: EngineError = { code: type, message: "AVPlay " + type, recoverable: /NETWORK|CONNECTION|TIMEOUT/i.test(String(type)) };
          this.events.emit("error", err);
        },
      });
      this.av.prepareAsync(() => {
        if (token !== this.token) return;
        try { this.dur = this.av.getDuration() / 1000; } catch { this.dur = 0; }
        this.events.emit("duration", this.dur);
        if (opts.startAt) this.seek(opts.startAt);
        if (this.wantPlay) this.play();
      }, (e: any) => {
        if (token !== this.token) return;
        this.events.emit("error", { code: e && e.name, message: "AVPlay prepare failed", recoverable: true } as EngineError);
      });
    } catch (e: any) {
      this.events.emit("error", { code: e && e.name, message: String(e && e.message), recoverable: true } as EngineError);
    }
  }

  play(): void {
    if (this.local && this.html5) { this.html5.play(); return; }
    this.wantPlay = true;
    const s = this.state();
    if (s === "READY" || s === "PAUSED") {
      try { this.av.play(); this.events.emit("playing"); } catch { /* not ready */ }
    }
  }

  pause(): void {
    if (this.local && this.html5) { this.html5.pause(); return; }
    this.wantPlay = false;
    if (this.state() === "PLAYING") {
      try { this.av.pause(); } catch { /* ignore */ }
    }
    this.events.emit("paused");
  }

  stop(): void {
    if (this.local && this.html5) { this.html5.stop(); return; }
    this.wantPlay = false;
    try { this.av.stop(); } catch { /* ignore */ }
  }

  seek(seconds: number): void {
    if (this.local && this.html5) { this.html5.seek(seconds); return; }
    const t = Math.max(0, this.dur ? Math.min(seconds, this.dur - 0.25) : seconds);
    try { this.av.seekTo(Math.round(t * 1000)); this.pos = t; this.events.emit("time", t); } catch { /* not seekable */ }
  }

  time(): number { return this.local && this.html5 ? this.html5.time() : this.pos; }
  duration(): number { return this.local && this.html5 ? this.html5.duration() : this.dur; }
  paused(): boolean { return this.local && this.html5 ? this.html5.paused() : this.state() !== "PLAYING"; }
  preload(): void { /* single native player: no look-ahead */ }

  on(event: EngineEvent, fn: (payload?: unknown) => void): () => void {
    return this.events.on(event, fn);
  }

  destroy(): void {
    this.token++;
    try { this.av.stop(); } catch { /* ignore */ }
    try { this.av.close(); } catch { /* ignore */ }
    if (this.html5) this.html5.destroy();
    this.events.clear();
  }
}
