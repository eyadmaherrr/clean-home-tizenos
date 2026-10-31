import type { EngineEvent, Listener } from "./AudioEvents";

/**
 * Common interface for the playback engines, so the app can switch between HTML5 Audio and
 * Samsung AVPlay without the UI or AudioManager knowing which one is running.
 */
export interface AudioEngine {
  readonly name: EngineName;
  /** Start loading a file; begins playing as soon as it can if `autoplay`. */
  load(url: string, opts?: { autoplay?: boolean; startAt?: number }): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  time(): number;
  duration(): number;
  paused(): boolean;
  /** Hint the next file so it can be buffered ahead (gapless). */
  preload(url: string | null): void;
  on(event: EngineEvent, fn: Listener): () => void;
  destroy(): void;
}

export type EngineName = "html5" | "avplay";

export interface EngineError {
  code: number | string;
  message: string;
  /** True for network/transport failures worth retrying. */
  recoverable: boolean;
}
