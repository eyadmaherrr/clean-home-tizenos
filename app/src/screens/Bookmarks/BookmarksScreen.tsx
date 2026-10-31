import { LibraryLayout, playAndOpen } from "../LibraryLayout";
import { Focusable } from "../../components/navigation/Focusable";
import { IconClose, IconPlay } from "../../components/icons";
import { toast } from "../../components/Toast";
import { clock } from "../../components/format";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { BookmarkService, useLibrary } from "../../services/bookmarks/BookmarkService";
import { reciter, surah as surahMeta } from "../../services/quran/QuranMetadata";
import { WallpaperService } from "../../services/wallpapers/WallpaperService";

type Kind = "bookmarks" | "recent" | "favorites";

interface Item { key: string; surah: number; ayah: number; reciter?: string; time?: number }

const TITLES: Record<Kind, string> = { bookmarks: "Bookmarks", recent: "Recently Played", favorites: "Favorites" };
const EMPTY: Record<Kind, string> = {
  bookmarks: "No bookmarks yet. In the player, press the bookmark button to save an ayah.",
  recent: "Nothing played yet.",
  favorites: "No favourite surahs yet. Add one from All Surahs.",
};

/** Bookmarks / Continue, Recently Played and Favorites share this list. */
export function BookmarksScreen({ kind }: { kind: Kind }) {
  const bookmarks = useLibrary((l) => l.bookmarks);
  const recent = useLibrary((l) => l.recent);
  const favorites = useLibrary((l) => l.favorites);
  useScreenFocus(kind);

  const items: Item[] =
    kind === "bookmarks" ? bookmarks.map((b) => ({ key: b.surah + ":" + b.ayah, surah: b.surah, ayah: b.ayah, reciter: b.reciter, time: b.time })) :
    kind === "recent" ? recent.map((r) => ({ key: "r" + r.surah, surah: r.surah, ayah: r.ayah, reciter: r.reciter })) :
    favorites.map((n) => ({ key: "f" + n, surah: n, ayah: 1 }));

  const remove = (it: Item) => {
    if (kind === "bookmarks") BookmarkService.removeBookmark(it.surah, it.ayah);
    else if (kind === "favorites") BookmarkService.toggleFavorite(it.surah);
    else BookmarkService.store.set({ recent: BookmarkService.store.get().recent.filter((r) => r.surah !== it.surah) });
    toast("Removed");
  };

  return (
    <LibraryLayout active={kind} title={TITLES[kind]}>
      {items.length === 0 ? <div className="empty glass">{EMPTY[kind]}</div> : (
        <div className="item-list" data-scroll="y">
          {items.map((it, i) => {
            const s = surahMeta(it.surah);
            const sub = kind === "favorites" ? s.ayahs + " verses · " + s.type : "Ayah " + it.ayah + (it.time ? " · " + clock(it.time) : "");
            return (
              <div key={it.key} className="item-row glass-tile">
                <img className="ir-art" src={WallpaperService.art(it.surah)} alt="" />
                <div className="ir-body">
                  <div className="ir-title">Surah {s.en}</div>
                  <div className="ir-sub">{sub}</div>
                  {it.reciter ? <div className="ir-sub dim">{reciter(it.reciter).short}</div> : null}
                </div>
                <Focusable id={kind + "-play-" + it.key} group={kind + "-list"} className="round-btn play-btn" isDefault={i === 0} label="Play"
                  onSelect={() => playAndOpen(it.surah, it.ayah, { reciter: it.reciter })}>
                  <IconPlay size={26} />
                </Focusable>
                <Focusable id={kind + "-del-" + it.key} group={kind + "-del"} className="round-btn" label="Remove" onSelect={() => remove(it)}>
                  <IconClose size={22} />
                </Focusable>
              </div>
            );
          })}
        </div>
      )}
    </LibraryLayout>
  );
}
