import { memo, useState } from "react";
import { LibraryLayout, playAndOpen } from "../LibraryLayout";
import { Focusable } from "../../components/navigation/Focusable";
import { Glass } from "../../components/glass/Glass";
import { IconPlay, IconStar, IconStarOn } from "../../components/icons";
import { toast } from "../../components/Toast";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { SURAHS, shortArabicName, surah as surahMeta, type SurahMeta } from "../../services/quran/QuranMetadata";
import { BookmarkService, useLibrary } from "../../services/bookmarks/BookmarkService";
import { WallpaperService } from "../../services/wallpapers/WallpaperService";
import { playerStore } from "../../services/audio/AudioManager";

/** One list row. Memoised: moving focus re-renders only the two rows whose selection changed,
 *  not all 114 (which was slow on TV hardware). */
const SurahRow = memo(function SurahRow({ s, selected, onFocus }: { s: SurahMeta; selected: boolean; onFocus: (n: number) => void }) {
  return (
    <Focusable id={"s-" + s.n} group="surah-list" className={"row surah-row" + (selected ? " is-selected" : "")}
      isDefault={selected} onFocus={() => onFocus(s.n)} onSelect={() => playAndOpen(s.n)}>
      <span className="sr-n">{s.n}</span>
      <span className="sr-en">{s.en}</span>
      <span className="sr-ar" dir="rtl" lang="ar">{shortArabicName(s)}</span>
      <span className="sr-count">{s.ayahs} verses</span>
    </Focusable>
  );
});

/** All 114 surahs; the focused one shows in the detail card on the right. */
export function SurahsScreen() {
  const [selected, setSelected] = useState(() => playerStore.get().surah || 1);
  useScreenFocus("surahs");
  const s = surahMeta(selected);
  const fav = useLibrary((l) => l.favorites.indexOf(selected) >= 0);

  return (
    <LibraryLayout active="surahs" title="All Surahs">
      <div className="surahs">
        <div className="surah-list" data-scroll="y">
          {SURAHS.map((x) => (
            <SurahRow key={x.n} s={x} selected={x.n === selected} onFocus={setSelected} />
          ))}
        </div>
        <Glass strong className="surah-detail">
          <img className="sd-art" src={WallpaperService.art(s.n)} alt="" />
          <div className="sd-body">
            <div className="sd-en">{s.en}</div>
            <div className="sd-ar" dir="rtl" lang="ar">{shortArabicName(s)}</div>
            <div className="sd-meta">{s.meaning} · {s.ayahs} verses · {s.type}</div>
            <Focusable id="sd-play" group="surah-detail" className="btn btn-primary" onSelect={() => playAndOpen(s.n)}>
              <IconPlay size={22} /> Play
            </Focusable>
            <Focusable id="sd-fav" group="surah-detail" className="btn btn-glass"
              onSelect={() => toast(BookmarkService.toggleFavorite(s.n) ? "Added to Favorites" : "Removed from Favorites")}>
              {fav ? <IconStarOn size={22} /> : <IconStar size={22} />} {fav ? "In Favorites" : "Add to Favorites"}
            </Focusable>
          </div>
        </Glass>
      </div>
    </LibraryLayout>
  );
}
