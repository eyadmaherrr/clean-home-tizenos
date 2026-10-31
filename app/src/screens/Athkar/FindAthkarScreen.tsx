import { useRef, useState } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { IconSearch } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { focusManager } from "../../platform/remote/FocusManager";
import { AthkarService } from "../../services/athkar/AthkarService";
import { openAthkar } from "./AthkarScreen";

// Samsung IME keys: Done and Cancel on the on-screen keyboard.
const IME_DONE = 65376, IME_CANCEL = 65385;
// Common occasions, as searches in the book's own words.
const SUGGESTED = ["الصباح", "المساء", "النوم", "الاستيقاظ", "الصلاة", "الوضوء", "السفر", "الطعام", "المسجد", "الكرب", "المطر", "المريض"];

/** Search Hisn al-Muslim by occasion (chapter title) or by words in the dhikr itself. */
export function FindAthkarScreen() {
  useScreenFocus("athkar-search");
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const results = AthkarService.search(query);

  const leaveInput = () => {
    if (input.current) input.current.blur();
    const wrap = box.current && (box.current.querySelector("[data-focus-id='ath-search-box']") as HTMLElement | null);
    if (wrap) focusManager.focus(wrap);
  };

  return (
    <div className="screen search">
      <TopBar />
      <div ref={box} className="search-body">
        <Focusable id="ath-search-box" group="ath-search-box" className="search-field glass-tile" isDefault
          onSelect={() => input.current && input.current.focus()}>
          <IconSearch size={28} />
          <input ref={input} value={query} dir="auto" placeholder="Find Athkar… ابحث عن ذكر"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.keyCode === 13 || e.keyCode === IME_DONE) { e.preventDefault(); e.stopPropagation(); leaveInput(); }
              else if (e.keyCode === IME_CANCEL || e.keyCode === 10009 || e.keyCode === 27) { e.preventDefault(); e.stopPropagation(); leaveInput(); }
              else if (e.keyCode === 38 || e.keyCode === 40) { leaveInput(); }
            }} />
        </Focusable>

        <div className="search-results" data-scroll="y">
          {!query.trim() ? (
            <>
              <div className="section-label">Suggested</div>
              <div className="chips" dir="rtl">
                {SUGGESTED.map((s) => (
                  <Focusable key={s} id={"ath-chip-" + s} group="ath-chips" className="chip glass-tile ar-chip" onSelect={() => setQuery(s)}>
                    <span lang="ar">{s}</span>
                  </Focusable>
                ))}
              </div>
            </>
          ) : (
            <>
              {results.chapters.length ? <div className="section-label">Chapters</div> : null}
              {results.chapters.map((c) => (
                <Focusable key={"c" + c.id} id={"fc-" + c.id} group="ath-res" className="row athkar-row" onSelect={() => openAthkar(c.id)}>
                  <span className="ath-count">{c.items.length}</span>
                  <span className="ath-title" dir="rtl" lang="ar">{c.t}</span>
                </Focusable>
              ))}
              <div className="section-label">
                {results.athkar.length ? results.athkar.length + " athkar" : results.chapters.length ? "" : "No athkar found"}
              </div>
              {results.athkar.map((h) => (
                <Focusable key={h.chapter.id + ":" + h.index} id={"fa-" + h.chapter.id + "-" + h.index} group="ath-res"
                  className="row athkar-hit" onSelect={() => openAthkar(h.chapter.id, h.index)}>
                  <span className="ah-chapter" dir="rtl" lang="ar">{h.chapter.t}</span>
                  <span className="ah-text" dir="rtl" lang="ar">{h.chapter.items[h.index].ar}</span>
                </Focusable>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
