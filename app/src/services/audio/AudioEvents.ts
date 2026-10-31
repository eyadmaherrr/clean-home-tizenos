/** Events every audio engine emits. */
export type EngineEvent =
  | "playing"     // audio is actually advancing
  | "paused"
  | "waiting"     // buffering
  | "time"        // position changed (throttled)
  | "duration"
  | "ended"
  | "error";

export type Listener = (payload?: unknown) => void;

export class Emitter<E extends string> {
  private map = new Map<E, Set<Listener>>();

  on(event: E, fn: Listener): () => void {
    let set = this.map.get(event);
    if (!set) { set = new Set(); this.map.set(event, set); }
    set.add(fn);
    return () => { set && set.delete(fn); };
  }

  emit(event: E, payload?: unknown): void {
    const set = this.map.get(event);
    if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } });
  }

  clear(): void {
    this.map.clear();
  }
}
