import { isTizen, tizen } from "./device";

/**
 * Samsung remote → app actions.
 *
 * Arrows, Enter and Back are mandatory keys on Tizen and always arrive as DOM keydown events.
 * Media keys are optional: only the ones the TV reports in getSupportedKeys() are registered
 * (registerKeyBatch, with per-key fallback), so an unsupported key never throws. In a desktop
 * browser the keyboard stands in: arrows, Enter, Escape/Backspace = Back, Space = play/pause,
 * N / P = next / previous ayah, ] / [ = forward / rewind.
 */
export type RemoteAction =
  | "up" | "down" | "left" | "right" | "enter" | "back"
  | "play" | "pause" | "playPause" | "stop" | "next" | "prev" | "forward" | "rewind";

const MANDATORY: Record<number, RemoteAction> = {
  37: "left", 38: "up", 39: "right", 40: "down", 13: "enter",
  10009: "back",            // Tizen Return
  27: "back", 8: "back",    // browser fallback
};

const OPTIONAL: Record<string, RemoteAction> = {
  MediaPlay: "play",
  MediaPause: "pause",
  MediaPlayPause: "playPause",
  MediaStop: "stop",
  MediaTrackNext: "next",
  MediaTrackPrevious: "prev",
  MediaFastForward: "forward",
  MediaRewind: "rewind",
};

/** Desktop keyboard stand-ins (by KeyboardEvent.key). */
const BROWSER: Record<string, RemoteAction> = {
  " ": "playPause", MediaPlayPause: "playPause", MediaTrackNext: "next", MediaTrackPrevious: "prev",
  n: "next", p: "prev", "]": "forward", "[": "rewind",
};

const codeToAction = new Map<number, RemoteAction>();
let registered: string[] = [];

function registerMediaKeys(): void {
  if (!isTizen || !tizen.tvinputdevice) return;
  let supported: { name: string; code: number }[] = [];
  try {
    supported = tizen.tvinputdevice.getSupportedKeys();
  } catch {
    return;
  }
  const wanted = supported.filter((k) => OPTIONAL[k.name]);
  wanted.forEach((k) => codeToAction.set(k.code, OPTIONAL[k.name]));
  const names = wanted.map((k) => k.name);
  if (!names.length) return;
  const one = () => {
    names.forEach((n) => {
      try { tizen.tvinputdevice.registerKey(n); registered.push(n); } catch { /* skip this key */ }
    });
  };
  try {
    if (typeof tizen.tvinputdevice.registerKeyBatch === "function") {
      tizen.tvinputdevice.registerKeyBatch(names, () => { registered = names.slice(); }, one);
    } else {
      one();
    }
  } catch {
    one();
  }
}

/** Keys registered on this TV (for diagnostics). */
export function registeredKeys(): string[] {
  return registered.slice();
}

export function initRemote(handler: (action: RemoteAction, e: KeyboardEvent) => void): () => void {
  registerMediaKeys();
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
    let action: RemoteAction | undefined = codeToAction.get(e.keyCode) || MANDATORY[e.keyCode];
    if (!action && !isTizen && !typing) action = BROWSER[e.key];
    // While typing in a field, Backspace edits text and Left/Right move the caret.
    if (typing && (e.keyCode === 8 || e.keyCode === 37 || e.keyCode === 39)) return;
    if (!action) return;
    e.preventDefault();
    handler(action, e);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
