import { createStore, useStore } from "../../state/store";
import { Storage } from "../storage/Storage";

/** Bookmarks, favourite surahs and recently played, persisted through Storage. */
export interface Bookmark { surah: number; ayah: number; reciter: string; time: number; at: number }
export interface Recent { surah: number; ayah: number; reciter: string; at: number }

interface Library { bookmarks: Bookmark[]; favorites: number[]; recent: Recent[] }

const store = createStore<Library>({
  bookmarks: Storage.get<Bookmark[]>("bookmarks", []),
  favorites: Storage.get<number[]>("favorites", []),
  recent: Storage.get<Recent[]>("recent", []),
});
store.subscribe(() => {
  const s = store.get();
  Storage.set("bookmarks", s.bookmarks);
  Storage.set("favorites", s.favorites);
  Storage.set("recent", s.recent);
});

export const BookmarkService = {
  store,

  isBookmarked(surah: number, ayah: number): boolean {
    return store.get().bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
  },

  toggleBookmark(b: Omit<Bookmark, "at">): boolean {
    const list = store.get().bookmarks;
    const exists = list.some((x) => x.surah === b.surah && x.ayah === b.ayah);
    store.set({
      bookmarks: exists
        ? list.filter((x) => !(x.surah === b.surah && x.ayah === b.ayah))
        : [{ ...b, at: Date.now() }].concat(list).slice(0, 200),
    });
    return !exists;
  },

  removeBookmark(surah: number, ayah: number): void {
    store.set({ bookmarks: store.get().bookmarks.filter((x) => !(x.surah === surah && x.ayah === ayah)) });
  },

  isFavorite(surah: number): boolean {
    return store.get().favorites.indexOf(surah) >= 0;
  },

  toggleFavorite(surah: number): boolean {
    const f = store.get().favorites;
    const on = f.indexOf(surah) < 0;
    store.set({ favorites: on ? [surah].concat(f) : f.filter((n) => n !== surah) });
    return on;
  },

  /** One entry per surah, newest first. */
  addRecent(r: Omit<Recent, "at">): void {
    const rest = store.get().recent.filter((x) => x.surah !== r.surah);
    store.set({ recent: [{ ...r, at: Date.now() }].concat(rest).slice(0, 30) });
  },
};

export function useLibrary<S>(selector: (l: Library) => S): S {
  return useStore(store, selector);
}
