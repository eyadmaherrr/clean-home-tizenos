import { useEffect, useLayoutEffect, type RefObject } from "react";
import { focusManager } from "./FocusManager";

/**
 * Restores a screen's last focused element when it mounts and remembers it when it
 * unmounts. `ready` lets a screen wait for async content (a list) before restoring.
 */
export function useScreenFocus(key: string, ready = true): void {
  useLayoutEffect(() => {
    if (!ready) return;
    focusManager.restoreScreen(key);
  }, [key, ready]);
  useEffect(() => () => focusManager.rememberScreen(key), [key]);
}

/** Makes an element (a dialog) the focus root while it is mounted. */
export function useFocusRoot(ref: RefObject<HTMLElement>, active = true): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    focusManager.pushRoot(el);
    focusManager.restoreScreen("root:" + (el.id || "dialog"));
    return () => focusManager.popRoot(el);
  }, [ref, active]);
}
