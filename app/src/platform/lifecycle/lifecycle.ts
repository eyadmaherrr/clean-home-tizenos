import { isTizen, tizen } from "../tizen/device";

/** App lifecycle: Tizen hides a backgrounded web app (visibilitychange), and the network can
 *  drop and return while the TV stays on. */
export function onVisibility(cb: (visible: boolean) => void): () => void {
  const fn = () => cb(!document.hidden);
  document.addEventListener("visibilitychange", fn);
  return () => document.removeEventListener("visibilitychange", fn);
}

export function onNetwork(cb: (online: boolean) => void): () => void {
  const on = () => cb(true);
  const off = () => cb(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}

export function exitApp(): void {
  if (isTizen) {
    try { tizen.application.getCurrentApplication().exit(); return; } catch { /* fall through */ }
  }
  window.close();
}
