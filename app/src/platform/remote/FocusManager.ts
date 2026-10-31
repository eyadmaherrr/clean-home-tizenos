/**
 * Spatial focus for the remote.
 *
 * Focusable elements carry `data-focusable` (+ optional `data-focus-id`, `data-focus-group`).
 * Arrow keys move to the nearest focusable in that direction inside the current root (the
 * screen, or a dialog pushed on top). Entering a group (a list, the sidebar) returns to the
 * item last focused there. Screens remember their focus by id and restore it when shown again.
 * Focus is never allowed to disappear: if the focused element goes away, the root's default
 * (`data-focus-default`) or its first focusable takes over.
 *
 * Before moving, the key is offered to the focused element as a cancelable `tvkey` event, so a
 * control can consume Left/Right (a slider, a value picker) or Enter.
 */
export type Direction = "up" | "down" | "left" | "right";
export type FocusAction = Direction | "enter";

export interface TvKeyDetail { action: FocusAction }

class FocusManager {
  private roots: HTMLElement[] = [];
  private current: HTMLElement | null = null;
  private groupMemory = new Map<string, string>();
  private screenMemory = new Map<string, string>();
  private listeners = new Set<(el: HTMLElement | null) => void>();

  /** Top-most active root (a dialog over a screen), or the app root. */
  root(): HTMLElement {
    return this.roots[this.roots.length - 1] || document.body;
  }

  private returnTo: (HTMLElement | null)[] = [];

  pushRoot(el: HTMLElement): void {
    this.returnTo.push(this.current);
    this.roots.push(el);
  }

  /** Closes a dialog root and returns focus to what had it before the dialog opened. */
  popRoot(el: HTMLElement): void {
    const i = this.roots.indexOf(el);
    if (i < 0) return;
    this.roots.splice(i, 1);
    const back = this.returnTo.splice(i, 1)[0];
    if (back && document.body.contains(back)) this.focus(back);
    else { this.current = null; this.ensureFocus(); }
  }

  onChange(fn: (el: HTMLElement | null) => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  focused(): HTMLElement | null {
    return this.current;
  }

  private focusables(root: HTMLElement = this.root()): HTMLElement[] {
    const all = root.querySelectorAll<HTMLElement>("[data-focusable]");
    const out: HTMLElement[] = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.getAttribute("aria-disabled") === "true") continue;
      if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue;
      out.push(el);
    }
    return out;
  }

  focus(el: HTMLElement | null): void {
    if (!el) return;
    const prev = this.current;
    this.current = el;
    // The ring is drawn from [data-focused], not :focus, so it shows even when the window
    // itself isn't focused (and React never overwrites this attribute).
    if (prev && prev !== el) prev.removeAttribute("data-focused");
    el.setAttribute("data-focused", "");
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    const group = el.getAttribute("data-focus-group");
    const id = el.getAttribute("data-focus-id");
    if (group && id) this.groupMemory.set(group, id);
    this.ensureVisible(el);
    if (prev !== el) this.listeners.forEach((l) => l(el));
  }

  focusById(id: string): boolean {
    const el = this.root().querySelector<HTMLElement>(`[data-focus-id="${cssEscape(id)}"]`);
    if (el && this.focusables().indexOf(el) >= 0) {
      this.focus(el);
      return true;
    }
    return false;
  }

  /** Make sure something inside the active root has focus. */
  ensureFocus(): void {
    const root = this.root();
    if (this.current && root.contains(this.current) && document.body.contains(this.current)) {
      if (document.activeElement !== this.current) this.focus(this.current);
      return;
    }
    const list = this.focusables(root);
    const def = list.filter((e) => e.hasAttribute("data-focus-default"))[0];
    this.focus(def || list[0] || null);
  }

  /** Remember the focused element for a screen, to restore when it comes back. */
  rememberScreen(key: string): void {
    const id = this.current && this.current.getAttribute("data-focus-id");
    if (id) this.screenMemory.set(key, id);
  }

  restoreScreen(key: string): void {
    const id = this.screenMemory.get(key);
    if (!(id && this.focusById(id))) {
      this.current = null;
      this.ensureFocus();
    }
  }

  /** Handle a navigation key. Returns true when it was used. */
  handle(action: FocusAction): boolean {
    this.ensureFocus();
    const cur = this.current;
    if (!cur) return false;
    const ev = createTvKey(action);
    cur.dispatchEvent(ev);
    if (ev.defaultPrevented) return true;
    if (action === "enter") {
      cur.click();
      return true;
    }
    return this.move(action);
  }

  move(dir: Direction): boolean {
    const cur = this.current;
    if (!cur) return false;
    const from = cur.getBoundingClientRect();
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const el of this.focusables()) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect();
      const s = score(dir, from, r);
      if (s < bestScore) { bestScore = s; best = el; }
    }
    if (!best) return false;
    // Coming into a group from outside: go back to where the user was in it.
    const g = best.getAttribute("data-focus-group");
    if (g && g !== cur.getAttribute("data-focus-group")) {
      const id = this.groupMemory.get(g);
      const remembered = id ? this.root().querySelector<HTMLElement>(`[data-focus-group="${cssEscape(g)}"][data-focus-id="${cssEscape(id)}"]`) : null;
      // Nothing remembered yet: a group's current item (the sidebar's active section) wins.
      const active = this.root().querySelector<HTMLElement>(`[data-focus-group="${cssEscape(g)}"].is-active`);
      const pick = remembered || active;
      if (pick && this.focusables().indexOf(pick) >= 0) best = pick;
    }
    this.focus(best);
    return true;
  }

  /** Scroll the nearest `data-scroll` container so the element sits fully in view. */
  private ensureVisible(el: HTMLElement): void {
    let box = el.parentElement;
    while (box && !box.hasAttribute("data-scroll")) box = box.parentElement;
    if (!box) return;
    const horizontal = box.getAttribute("data-scroll") === "x";
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // The stage is scaled to the window: convert screen px back to layout px.
    const scale = horizontal ? (b.width / (box.clientWidth || 1)) || 1 : (b.height / (box.clientHeight || 1)) || 1;
    const margin = 40;
    if (horizontal) {
      if (r.left < b.left + margin) box.scrollLeft -= (b.left + margin - r.left) / scale;
      else if (r.right > b.right - margin) box.scrollLeft += (r.right - (b.right - margin)) / scale;
    } else {
      if (r.top < b.top + margin) box.scrollTop -= (b.top + margin - r.top) / scale;
      else if (r.bottom > b.bottom - margin) box.scrollTop += (r.bottom - (b.bottom - margin)) / scale;
    }
  }
}

/** Lower is better; Infinity when `r` is not in direction `dir` from `f`. */
function score(dir: Direction, f: DOMRect, r: DOMRect): number {
  const fx = f.left + f.width / 2, fy = f.top + f.height / 2;
  const rx = r.left + r.width / 2, ry = r.top + r.height / 2;
  let primary: number, cross: number;
  if (dir === "right") { if (r.left < f.right - 4 && rx <= fx + 4) return Infinity; primary = Math.max(0, r.left - f.right); cross = overlapGap(f.top, f.bottom, r.top, r.bottom); }
  else if (dir === "left") { if (r.right > f.left + 4 && rx >= fx - 4) return Infinity; primary = Math.max(0, f.left - r.right); cross = overlapGap(f.top, f.bottom, r.top, r.bottom); }
  else if (dir === "down") { if (r.top < f.bottom - 4 && ry <= fy + 4) return Infinity; primary = Math.max(0, r.top - f.bottom); cross = overlapGap(f.left, f.right, r.left, r.right); }
  else { if (r.bottom > f.top + 4 && ry >= fy - 4) return Infinity; primary = Math.max(0, f.top - r.bottom); cross = overlapGap(f.left, f.right, r.left, r.right); }
  if ((dir === "right" && rx <= fx) || (dir === "left" && rx >= fx) || (dir === "down" && ry <= fy) || (dir === "up" && ry >= fy)) return Infinity;
  return primary + cross * 3;
}

/** 0 when the ranges overlap, otherwise the gap between them. */
function overlapGap(a1: number, a2: number, b1: number, b2: number): number {
  if (b2 < a1) return a1 - b2;
  if (b1 > a2) return b1 - a2;
  return 0;
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}

function createTvKey(action: FocusAction): CustomEvent<TvKeyDetail> {
  // CustomEvent constructor is fine on Chromium 69.
  return new CustomEvent<TvKeyDetail>("tvkey", { detail: { action }, bubbles: true, cancelable: true });
}

export const focusManager = new FocusManager();
