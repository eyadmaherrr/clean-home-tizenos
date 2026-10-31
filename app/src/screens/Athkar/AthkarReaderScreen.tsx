import { useEffect, useRef, useState } from "react";
import { Focusable } from "../../components/navigation/Focusable";
import { AyahDisplay } from "../../components/quran/AyahDisplay";
import { IconBack, IconNext, IconPrev } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { back } from "../../app/navigation";
import { athkarStore, chapter as chapterOf, useAthkar } from "../../services/athkar/AthkarService";

/** One Hisn al-Muslim dhikr fills the screen. OK on the counter counts a repetition; when it
 *  reaches zero the next dhikr opens. */
export function AthkarReaderScreen() {
  useScreenFocus("athkar-read");
  const chapterId = useAthkar((s) => s.chapter);
  const index = useAthkar((s) => s.index);
  const c = chapterOf(chapterId);
  const d = c.items[index] || c.items[0];
  const total = c.items.length;
  const [left, setLeft] = useState(d.n);
  const advance = useRef(0);

  useEffect(() => {
    setLeft(d.n);
    return () => window.clearTimeout(advance.current);
  }, [chapterId, index, d.n]);

  const go = (i: number) => {
    if (i < 0 || i >= total) return;
    window.clearTimeout(advance.current);
    athkarStore.set({ index: i });
  };

  const count = () => {
    if (left <= 0) { go(index + 1); return; }
    const next = left - 1;
    setLeft(next);
    if (next === 0 && index + 1 < total) advance.current = window.setTimeout(() => go(index + 1), 700);
  };

  const done = left === 0;

  return (
    <div className="screen athkar-read">
      <div className="player-top">
        <Focusable id="ar-back" group="ar-top" className="pill back-pill" onSelect={back}><IconBack size={22} /> Back</Focusable>
        <div className="player-title">
          <div className="pt-surah" dir="rtl" lang="ar">{c.t}</div>
          <div className="pt-reciter">{index + 1} of {total}</div>
        </div>
        <div className="player-top-actions" />
      </div>

      <div className="athkar-text">
        <AyahDisplay key={chapterId + ":" + index} arabic={d.ar} max={64} min={24} />
      </div>

      <div className="athkar-controls">
        <Focusable id="ar-prev" group="ar-ctl" className={"ctl" + (index === 0 ? " is-disabled" : "")} label="Previous" onSelect={() => go(index - 1)}>
          <IconPrev size={36} />
        </Focusable>
        <Focusable id="ar-count" group="ar-ctl" className={"counter" + (done ? " done" : "")} isDefault label="Count" onSelect={count}>
          <span className="counter-n">{done ? "✓" : left}</span>
          <span className="counter-label">{done ? "Done" : d.n > 1 ? "Press OK to count" : "Press OK"}</span>
        </Focusable>
        <Focusable id="ar-next" group="ar-ctl" className={"ctl" + (index + 1 >= total ? " is-disabled" : "")} label="Next" onSelect={() => go(index + 1)}>
          <IconNext size={36} />
        </Focusable>
      </div>
    </div>
  );
}
