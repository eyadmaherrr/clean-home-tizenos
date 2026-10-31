import type { ReactNode } from "react";
import { TopBar } from "../components/navigation/TopBar";
import { Sidebar } from "../components/navigation/Sidebar";
import type { ScreenName } from "../app/navigation";

/** Top bar + sidebar + content: All Surahs, Juz', Bookmarks, Recently Played, Favorites, Settings. */
export function LibraryLayout({ active, title, children }: { active: ScreenName; title: string; children: ReactNode }) {
  return (
    <div className="screen library">
      <TopBar />
      <Sidebar active={active} />
      <main className="library-main">
        <h1 className="screen-title">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** Start a surah (from an ayah) and open the full-screen player. */
export { playAndOpen } from "./playAndOpen";
