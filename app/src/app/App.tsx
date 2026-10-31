import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { back, closeExitPrompt, useExitPrompt, useRoute, type Route } from "./navigation";
import { initRemote, type RemoteAction } from "../platform/tizen/remote";
import { focusManager } from "../platform/remote/FocusManager";
import { useFocusRoot } from "../platform/remote/useScreenFocus";
import { exitApp } from "../platform/lifecycle/lifecycle";
import { supportsBackdrop, isTizen, chromium } from "../platform/tizen/device";
import { AudioManager } from "../services/audio/AudioManager";
import { WallpaperService } from "../services/wallpapers/WallpaperService";
import { useSetting } from "../state/settings";
import { Focusable } from "../components/navigation/Focusable";
import { Glass } from "../components/glass/Glass";
import { Toast } from "../components/Toast";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { PlayerScreen } from "../screens/Player/PlayerScreen";
import { SurahsScreen } from "../screens/Surahs/SurahsScreen";
import { JuzScreen } from "../screens/Juz/JuzScreen";
import { RecitersScreen } from "../screens/Reciters/RecitersScreen";
import { BookmarksScreen } from "../screens/Bookmarks/BookmarksScreen";
import { SettingsScreen } from "../screens/Settings/SettingsScreen";
import { SearchScreen } from "../screens/Search/SearchScreen";
import { HisnScreen } from "../screens/Athkar/AthkarScreen";
import { AthkarMenuScreen } from "../screens/Athkar/AthkarMenuScreen";
import { PrayerScreen } from "../screens/Prayer/PrayerScreen";
import { AthkarReaderScreen } from "../screens/Athkar/AthkarReaderScreen";
import { FindAthkarScreen } from "../screens/Athkar/FindAthkarScreen";
import { AthkarListenScreen } from "../screens/Athkar/AthkarListenScreen";

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case "player": return <PlayerScreen />;
    case "surahs": return <SurahsScreen />;
    case "juz": return <JuzScreen />;
    case "reciters": return <RecitersScreen />;
    case "bookmarks": return <BookmarksScreen kind="bookmarks" />;
    case "recent": return <BookmarksScreen kind="recent" />;
    case "favorites": return <BookmarksScreen kind="favorites" />;
    case "settings": return <SettingsScreen />;
    case "search": return <SearchScreen />;
    case "athkar": return <AthkarMenuScreen />;
    case "hisn": return <HisnScreen />;
    case "prayer": return <PrayerScreen />;
    case "athkar-read": return <AthkarReaderScreen />;
    case "athkar-search": return <FindAthkarScreen />;
    case "athkar-listen": return <AthkarListenScreen />;
    default: return <HomeScreen />;
  }
}

let lastMove = 0;

function onAction(action: RemoteAction, e: KeyboardEvent): void {
  // Held keys auto-repeat faster than a TV can move focus; let at most one repeat through per
  // ~110 ms and drop repeats that waited in the queue, so focus stops when the key is released.
  // Single presses are never dropped.
  if (e.repeat && (action === "up" || action === "down" || action === "left" || action === "right")) {
    const now = performance.now();
    if (now - lastMove < 110 || now - e.timeStamp > 150) return;
  }
  if (action === "up" || action === "down" || action === "left" || action === "right") lastMove = performance.now();
  switch (action) {
    case "back": back(); return;
    case "up": case "down": case "left": case "right": case "enter": focusManager.handle(action); return;
    case "playPause": AudioManager.toggle(); return;
    case "play": AudioManager.resume(); return;
    case "pause": case "stop": AudioManager.pause(); return;
    case "next": AudioManager.nextAyah(); return;
    case "prev": AudioManager.prevAyah(); return;
    case "forward": AudioManager.seekBy(10); return;
    case "rewind": AudioManager.seekBy(-10); return;
  }
}

function ExitDialog() {
  const ref = useRef<HTMLDivElement>(null);
  useFocusRoot(ref);
  return (
    <div className="dialog-veil">
      <div ref={ref} id="exit-dialog">
        <Glass strong className="dialog">
          <div className="dialog-title">Exit Quran Play?</div>
          <div className="dialog-text">Your place is saved, so you can continue from this ayah next time.</div>
          <div className="dialog-actions">
            <Focusable id="exit-cancel" className="btn btn-glass" isDefault onSelect={closeExitPrompt}>Stay</Focusable>
            <Focusable id="exit-ok" className="btn btn-primary" onSelect={exitApp}>Exit</Focusable>
          </div>
        </Glass>
      </div>
    </div>
  );
}

function Wallpaper() {
  const theme = useSetting("theme");
  const [phase, setPhase] = useState(() => WallpaperService.phase(theme));
  useEffect(() => {
    setPhase(WallpaperService.phase(theme));
    const t = window.setInterval(() => setPhase(WallpaperService.phase(theme)), 60000);
    return () => window.clearInterval(t);
  }, [theme]);
  return (
    <div className="wallpaper-layer">
      <img key={phase} className="wallpaper" src={WallpaperService.wallpaper(phase)} alt="" />
      <div className={"wallpaper-shade phase-" + phase} />
    </div>
  );
}

/** Lays the 1920×1080 design onto any window size (TV windows are 1920×1080 CSS px). */
function useFit(ref: React.RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      el.style.transform = s === 1 ? "" : "scale(" + s + ")";
      el.style.left = (window.innerWidth - 1920 * s) / 2 + "px";
      el.style.top = (window.innerHeight - 1080 * s) / 2 + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref]);
}

export function App() {
  const route = useRoute();
  const exitPrompt = useExitPrompt();
  const glass = useSetting("glass");
  const stage = useRef<HTMLDivElement>(null);
  useFit(stage);

  useEffect(() => initRemote(onAction), []);

  useEffect(() => {
    // Blur is costly on TV GPUs: "auto" keeps it for desktop browsers and Tizen 7+ (Chromium 94+).
    const full = glass === "full" || (glass === "auto" && supportsBackdrop() && (!isTizen || chromium >= 94));
    const cl = document.documentElement.classList;
    cl.toggle("glass-full", full);
    cl.toggle("glass-lite", !full);
  }, [glass]);

  // Focus must never disappear: after any screen change, make sure something is focused.
  useEffect(() => {
    const t = window.setTimeout(() => focusManager.ensureFocus(), 0);
    return () => window.clearTimeout(t);
  }, [route.id, exitPrompt]);

  return (
    <div id="stage" ref={stage}>
      <Wallpaper />
      <Screen key={route.id} route={route} />
      {exitPrompt ? <ExitDialog /> : null}
      <Toast />
    </div>
  );
}
