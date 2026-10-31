import { Focusable } from "./Focusable";
import { navigate, goHome } from "../../app/navigation";
import { IconBook, IconGear, IconMenu, IconSearch, Logo } from "../icons";

/** "Quran Play / Listen · Reflect · Reconnect" with the search, surahs, settings and home pill. */
export function TopBar() {
  return (
    <div className="topbar">
      <div className="brand">
        <Logo size={58} />
        <div className="brand-text">
          <div className="brand-title">Quran Play</div>
          <div className="brand-sub">Listen · Reflect · Reconnect</div>
        </div>
      </div>
      <div className="glass topbar-actions">
        <Focusable id="top-search" group="topbar" className="icon-btn" label="Search" onSelect={() => navigate("search")}><IconSearch /></Focusable>
        <Focusable id="top-surahs" group="topbar" className="icon-btn" label="All surahs" onSelect={() => navigate("surahs")}><IconBook /></Focusable>
        <Focusable id="top-settings" group="topbar" className="icon-btn" label="Settings" onSelect={() => navigate("settings")}><IconGear /></Focusable>
        <Focusable id="top-home" group="topbar" className="icon-btn" label="Home" onSelect={goHome}><IconMenu /></Focusable>
      </div>
    </div>
  );
}
