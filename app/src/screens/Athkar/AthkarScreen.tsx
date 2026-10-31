import { memo } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { IconFindAthkar } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { navigate } from "../../app/navigation";
import { CHAPTERS, athkarStore, useAthkar, type AthkarChapter } from "../../services/athkar/AthkarService";

export function openAthkar(chapter: number, index = 0): void {
  athkarStore.set({ chapter, index });
  navigate("athkar-read");
}

/** Memoised like the surah rows: a focus move re-renders two rows, not all 132. */
const ChapterRow = memo(function ChapterRow({ c, current }: { c: AthkarChapter; current: boolean }) {
  return (
    <Focusable id={"ath-" + c.id} group="athkar-list" className={"row athkar-row" + (current ? " is-selected" : "")}
      isDefault={current} onSelect={() => openAthkar(c.id)}>
      <span className="ath-count">{c.items.length}</span>
      <span className="ath-title" dir="rtl" lang="ar">{c.t}</span>
    </Focusable>
  );
});

/** Every chapter of Hisn al-Muslim, in the book's order (morning & evening first). */
export function HisnScreen() {
  useScreenFocus("hisn");
  const current = useAthkar((s) => s.chapter);
  return (
    <div className="screen hisn">
      <TopBar />
      <div className="athkar-body">
        <div className="hisn-head">
          <h1 className="screen-title">Hisn al-Muslim <span className="screen-sub" dir="rtl" lang="ar">حصن المسلم</span></h1>
          <Focusable id="hisn-find" group="hisn-head" className="pill" onSelect={() => navigate("athkar-search")}>
            <IconFindAthkar size={24} /> Find Athkar
          </Focusable>
        </div>
        <div className="athkar-grid" data-scroll="y">
          {CHAPTERS.map((c) => <ChapterRow key={c.id} c={c} current={c.id === current} />)}
        </div>
      </div>
    </div>
  );
}
