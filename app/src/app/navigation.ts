import { createStore, useStore } from "../state/store";

export type ScreenName =
  | "home" | "player" | "reciters" | "search"
  | "surahs" | "juz" | "bookmarks" | "recent" | "favorites" | "settings"
  | "athkar" | "hisn" | "athkar-read" | "athkar-search" | "athkar-listen" | "prayer";

/** Screens that share the sidebar layout: switching between them replaces, not stacks. */
export const LIBRARY: ScreenName[] = ["surahs", "juz", "bookmarks", "recent", "favorites", "settings"];

export interface Route { name: ScreenName; id: number }

let nextId = 1;
const navStore = createStore<{ stack: Route[]; exitPrompt: boolean }>({ stack: [{ name: "home", id: 0 }], exitPrompt: false });

export function navigate(name: ScreenName): void {
  const stack = navStore.get().stack;
  const top = stack[stack.length - 1];
  if (top.name === name) return;
  const replace = LIBRARY.indexOf(top.name) >= 0 && LIBRARY.indexOf(name) >= 0;
  const route = { name, id: nextId++ };
  navStore.set({ stack: replace ? stack.slice(0, -1).concat(route) : stack.concat(route) });
}

/** Go back one screen; on Home, ask before leaving the app. */
export function back(): void {
  const { stack, exitPrompt } = navStore.get();
  if (exitPrompt) { navStore.set({ exitPrompt: false }); return; }
  if (stack.length > 1) navStore.set({ stack: stack.slice(0, -1) });
  else navStore.set({ exitPrompt: true });
}

export function goHome(): void {
  navStore.set({ stack: [navStore.get().stack[0]] });
}

export function closeExitPrompt(): void {
  navStore.set({ exitPrompt: false });
}

/** The screen on top, for code outside React (remote key handling). */
export function currentRoute(): ScreenName {
  const stack = navStore.get().stack;
  return stack[stack.length - 1].name;
}

export function useRoute(): Route {
  return useStore(navStore, (s) => s.stack[s.stack.length - 1]);
}

export function useExitPrompt(): boolean {
  return useStore(navStore, (s) => s.exitPrompt);
}
