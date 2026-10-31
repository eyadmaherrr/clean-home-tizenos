import type { ComponentType } from "react";
import { Focusable } from "./Focusable";
import { navigate, type ScreenName } from "../../app/navigation";
import { IconBookmark, IconGear, IconHistory, IconLayers, IconQuran, IconStar } from "../icons";

const ITEMS: { name: ScreenName; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { name: "surahs", label: "All Surahs", Icon: IconQuran },
  { name: "juz", label: "Juz'", Icon: IconLayers },
  { name: "bookmarks", label: "Bookmarks", Icon: IconBookmark },
  { name: "recent", label: "Recently Played", Icon: IconHistory },
  { name: "favorites", label: "Favorites", Icon: IconStar },
  { name: "settings", label: "Settings", Icon: IconGear },
];

export function Sidebar({ active }: { active: ScreenName }) {
  return (
    <nav className="sidebar">
      {ITEMS.map(({ name, label, Icon }) => (
        <Focusable key={name} id={"side-" + name} group="sidebar"
          className={"side-item" + (name === active ? " is-active" : "")}
          onSelect={() => navigate(name)}>
          <Icon size={26} />
          <span>{label}</span>
        </Focusable>
      ))}
    </nav>
  );
}
