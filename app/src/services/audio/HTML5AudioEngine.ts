import type { AudioEngine, EngineError } from "./AudioEngine";
import { Emitter, type EngineEvent } from "./AudioEvents";

/**
 * HTML5 Audio engine (default). Verified on a Tizen 6.0 TV: per-ayah MP3s from
 * cdn.islamic.network load in ~1.5 s and play to the end. Two <audio> elements are used: while
 * one plays, the other buffers the next ayah, and `load()` swaps them when the URL matches,
 * so consecutive ayahs follow each other without a network gap.
 */
export class HTML5AudioEngine implements AudioEngine {
  readonly name = "html5" as const;
  private events = new Emitter<EngineEvent>();
  private active: HTMLAudioElement;
  private standby: HTMLAudioElement;
  private wantPlay = false;
  private lastTimeEmit = 0;
  private cleanup: (() => void)[] = [];

  constructor() {
    this.active = this.make();
    this.standby = this.make();
  }

  private make(): HTMLAudioElement {
    const a = new Audio();
    a.preload = "auto";
    const on = (type: string, fn: () => void) => {
      const h = () => { if (a === this.active) fn(); };
      a.addEventListener(type, h);
      this.cleanup.push(() => a.removeEventListener(type, h));
    };
    on("playing", () => this.events.emit("playing"));
    on("pause", () => { if (!a.ended) this.events.emit("paused"); });
    on("waiting", () => this.events.emit("waiting"));
    on("stalled", () => { if (this.wantPlay) this.events.emit("waiting"); });
    on("durationchange", () => this.events.emit("duration", a.duration));
    on("ended", () => this.events.emit("ended"));
    on("timeupdate", () => {
      const now = Date.now();
      if (now - this.lastTimeEmit >= 240) { this.lastTimeEmit = now; this.events.emit("time", a.currentTime); }
    });
    on("error", () => {
      const code = a.error ? a.error.code : 0;
      // 2 = network, 3 = decode, 4 = source not supported / unreachable.
      const err: EngineError = { code, message: "Audio error " + code, recoverable: code !== 3 };
      this.events.emit("error", err);
    });
    return a;
  }

  load(url: string, opts: { autoplay?: boolean; startAt?: number } = {}): void {
    this.wantPlay = opts.autoplay !== false;
    const prev = this.active;
    if (this.standby.src === url && this.standby.readyState >= 2) {
      // The next ayah is already buffered: swap elements.
      this.active = this.standby;
      this.standby = prev;
      this.standby.pause();
    } else {
      this.active.src = url;
      this.active.load();
    }
    if (opts.startAt) {
      const t = opts.startAt;
      const seekWhenReady = () => { try { this.active.currentTime = t; } catch { /* ignore */ } };
      if (this.active.readyState >= 1) seekWhenReady();
      else this.active.addEventListener("loadedmetadata", seekWhenReady, { once: true } as AddEventListenerOptions);
    }
    this.events.emit("duration", this.active.duration || 0);
    if (this.wantPlay) this.play();
  }

  play(): void {
    this.wantPlay = true;
    const p = this.active.play();
    if (p && typeof p.catch === "function") {
      p.catch((e: Error) => {
        if (e && e.name === "AbortError") return; // superseded by a newer load
        this.events.emit("error", { code: e.name, message: e.message, recoverable: e.name !== "NotSupportedError" } as EngineError);
      });
    }
  }

  pause(): void {
    this.wantPlay = false;
    this.active.pause();
  }

  stop(): void {
    this.wantPlay = false;
    this.active.pause();
    try { this.active.currentTime = 0; } catch { /* ignore */ }
  }

  seek(seconds: number): void {
    const d = this.active.duration;
    const t = Math.max(0, isFinite(d) && d > 0 ? Math.min(seconds, d - 0.25) : seconds);
    try { this.active.currentTime = t; } catch { /* not seekable yet */ }
    this.events.emit("time", t);
  }

  time(): number { return this.active.currentTime || 0; }
  duration(): number { const d = this.active.duration; return isFinite(d) ? d : 0; }
  paused(): boolean { return this.active.paused; }

  preload(url: string | null): void {
    if (!url) return;
    if (this.standby.src !== url) {
      this.standby.src = url;
      this.standby.load();
    }
  }

  on(event: EngineEvent, fn: (payload?: unknown) => void): () => void {
    return this.events.on(event, fn);
  }

  destroy(): void {
    this.cleanup.forEach((f) => f());
    [this.active, this.standby].forEach((a) => { a.pause(); a.removeAttribute("src"); a.load(); });
    this.events.clear();
  }
}
