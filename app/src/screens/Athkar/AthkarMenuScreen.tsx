import type { ComponentType } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { IconBook, IconMoon, IconSun } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { navigate } from "../../app/navigation";
import { athkarStore } from "../../services/athkar/AthkarService";

const OPTIONS: { id: string; title: string; ar: string; sub: string; Icon: ComponentType<{ size?: number }>; open: () => void }[] = [
  {
    id: "morning", title: "Morning Athkar", ar: "أذكار الصباح", sub: "Mishary Alafasy", Icon: IconSun,
    open: () => { athkarStore.set({ time: "morning" }); navigate("athkar-listen"); },
  },
  {
    id: "evening", title: "Evening Athkar", ar: "أذكار المساء", sub: "Mishary Alafasy", Icon: IconMoon,
    open: () => { athkarStore.set({ time: "evening" }); navigate("athkar-listen"); },
  },
  {
    id: "hisn", title: "Hisn al-Muslim", ar: "حصن المسلم", sub: "All 132 chapters", Icon: IconBook,
    open: () => navigate("hisn"),
  },
];

/** Morning Athkar, Evening Athkar, or the whole of Hisn al-Muslim. Morning is focused before
 *  noon and Evening after. */
export function AthkarMenuScreen() {
  useScreenFocus("athkar");
  const evening = new Date().getHours() >= 12;
  return (
    <div className="screen athkar-menu">
      <TopBar />
      <div className="athkar-menu-body">
        <h1 className="screen-title">Athkar</h1>
        <div className="athkar-options">
          {OPTIONS.map(({ id, title, ar, sub, Icon, open }) => (
            <Focusable key={id} id={"am-" + id} group="athkar-options" className="athkar-option glass-tile"
              isDefault={id === (evening ? "evening" : "morning")} onSelect={open}>
              <Icon size={64} />
              <div className="ao-ar" lang="ar">{ar}</div>
              <div className="ao-title">{title}</div>
              <div className="ao-sub">{sub}</div>
            </Focusable>
          ))}
        </div>
      </div>
    </div>
  );
}
