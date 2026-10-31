import { useRef, useState } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { IconSearch } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { focusManager } from "../../platform/remote/FocusManager";
import { playAndOpen } from "../playAndOpen";
import { SearchService } from "../../services/search/SearchService";
import { surah as surahMeta } from "../../services/quran/QuranMetadata";
import { WallpaperService } from "../../services/wallpapers/WallpaperService";
import { settingsStore } from "../../state/settings";

const POPULAR = [18, 36, 55, 56];
// Samsung IME keys: Done and Cancel on the on-screen keyboard.
const IME_DONE = 65376, IME_CANCEL = 65385;

export function SearchScreen() {
  useScreenFocus("search");
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(SearchService.recent());
  const [ayahs, setAyahs] = useState<{ surah: number; ayah: number; text: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const surahs = SearchService.surahs(query);

  const submit = (q: string) => {
    const text = q.trim();
    setQuery(text);
    if (!text) { setAyahs(null); return; }
    SearchService.remember(text);
    setRecent(SearchService.recent());
    setBusy(true);
    SearchService.ayahs(text, settingsStore.get().translation).then((r) => { setAyahs(r); setBusy(false); });
  };

  const leaveInput = () => {
    if (input.current) input.current.blur();
    const wrap = box.current && (box.current.querySelector("[data-focus-id='search-box']") as HTMLElement | null);
    if (wrap) focusManager.focus(wrap);
  };

  return (
    <div className="screen search">
      <TopBar />
      <div ref={box} className="search-body">
        <Focusable id="search-box" group="search-box" className="search-field glass-tile" isDefault
          onSelect={() => input.current && input.current.focus()}>
          <IconSearch size={28} />
          <input ref={input} value={query} placeholder="Search Surah, Ayah or Keyword…"
            onChange={(e) => { setQuery(e.target.value); setAyahs(null); }}
            onKeyDown={(e) => {
              if (e.keyCode === 13 || e.keyCode === IME_DONE) { e.preventDefault(); e.stopPropagation(); submit(query); leaveInput(); }
              else if (e.keyCode === IME_CANCEL || e.keyCode === 10009 || e.keyCode === 27) { e.preventDefault(); e.stopPropagation(); leaveInput(); }
              else if (e.keyCode === 38 || e.keyCode === 40) { leaveInput(); }
            }} />
        </Focusable>

        <div className="search-results" data-scroll="y">
          {!query ? (
            <>
              {recent.length ? <div className="section-label">Recent Searches</div> : null}
              <div className="chips">
                {recent.map((r) => (
                  <Focusable key={r} id={"chip-" + r} group="chips" className="chip glass-tile" onSelect={() => submit(r)}>{r}</Focusable>
                ))}
              </div>
              <div className="section-label">Popular</div>
              <div className="cards">
                {POPULAR.map((n) => (
                  <Focusable key={n} id={"pop-" + n} group="popular" className="art-card" onSelect={() => playAndOpen(n)}>
                    <img src={WallpaperService.art(n)} alt="" />
                    <div className="art-title">Surah {surahMeta(n).en}</div>
                  </Focusable>
                ))}
              </div>
            </>
          ) : (
            <>
              {surahs.length ? <div className="section-label">Surahs</div> : null}
              {surahs.map((s) => (
                <Focusable key={s.n} id={"rs-" + s.n} group="res" className="row result-row" onSelect={() => playAndOpen(s.n)}>
                  <span className="sr-n">{s.n}</span><span className="sr-en">{s.en}</span>
                  <span className="sr-meaning">{s.meaning}</span><span className="sr-count">{s.ayahs} verses</span>
                </Focusable>
              ))}
              <div className="section-label">{busy ? "Searching ayahs…" : ayahs ? ayahs.length + " ayah" + (ayahs.length === 1 ? "" : "s") : "Press OK on the keyboard to search ayahs"}</div>
              {(ayahs || []).map((a) => (
                <Focusable key={a.surah + ":" + a.ayah} id={"ra-" + a.surah + "-" + a.ayah} group="res" className="row result-row ayah-hit"
                  onSelect={() => playAndOpen(a.surah, a.ayah)}>
                  <span className="sr-ref">{surahMeta(a.surah).en} {a.surah}:{a.ayah}</span>
                  <span className="sr-text">{a.text}</span>
                </Focusable>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
