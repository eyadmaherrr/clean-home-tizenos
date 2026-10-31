import { LibraryLayout, playAndOpen } from "../LibraryLayout";
import { Focusable } from "../../components/navigation/Focusable";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { JUZS, juzStart } from "../../services/quran/QuranMetadata";

/** The 30 parts, each labelled with where it begins (from the verified metadata). */
export function JuzScreen() {
  useScreenFocus("juz");
  return (
    <LibraryLayout active="juz" title="Juz' (Parts)">
      <div className="juz-grid" data-scroll="y">
        {JUZS.map((j) => {
          const { surah } = juzStart(j.n);
          return (
            <Focusable key={j.n} id={"juz-" + j.n} group="juz" className="juz-card glass-tile" isDefault={j.n === 1}
              onSelect={() => playAndOpen(j.surah, j.ayah)}>
              <div className="juz-n">{j.n}</div>
              <div className="juz-label">Juz' {j.n}</div>
              <div className="juz-start">{surah.en} {j.surah}:{j.ayah}</div>
            </Focusable>
          );
        })}
      </div>
    </LibraryLayout>
  );
}
