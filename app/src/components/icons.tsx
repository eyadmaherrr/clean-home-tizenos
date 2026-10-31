import type { ReactNode } from "react";

/** White monochrome line icons (24×24 grid), sized by the `size` prop. */
type IconProps = { size?: number; className?: string };

function svg(children: ReactNode, fill = false) {
  return function Icon({ size = 28, className }: IconProps) {
    return (
      <svg className={"icon " + (className || "")} width={size} height={size} viewBox="0 0 24 24"
        fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"}
        strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    );
  };
}

/** Prayer beads (tasbih). */
export const IconTasbih = svg(<><circle cx="12" cy="4.6" r="1.6" /><circle cx="17.2" cy="6.8" r="1.6" /><circle cx="19.4" cy="12" r="1.6" /><circle cx="17.2" cy="17.2" r="1.6" /><circle cx="6.8" cy="6.8" r="1.6" /><circle cx="4.6" cy="12" r="1.6" /><circle cx="6.8" cy="17.2" r="1.6" /><path d="M12 19.4v2.6M10.6 22h2.8" /><circle cx="12" cy="18.2" r="1.2" /></>);
/** A magnifier over beads: search the athkar. */
export const IconFindAthkar = svg(<><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5" /><circle cx="10.5" cy="7.6" r=".9" /><circle cx="13.4" cy="10.5" r=".9" /><circle cx="10.5" cy="13.4" r=".9" /><circle cx="7.6" cy="10.5" r=".9" /></>);
export const IconSun = svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2.8v2.2M12 19v2.2M21.2 12H19M5 12H2.8M18.5 5.5L17 7M7 17l-1.5 1.5M18.5 18.5L17 17M7 7L5.5 5.5" /></>);
export const IconMoon = svg(<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z" />);
/** A mosque dome with a crescent: prayer times. */
export const IconMosque = svg(<><path d="M12 2.6v2" /><path d="M5 20.5v-6a7 7 0 0114 0v6" /><path d="M3 20.5h18" /><path d="M10 20.5v-3a2 2 0 014 0v3" /></>);
export const IconSearch = svg(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>);
export const IconBook = svg(<><path d="M3.5 5.5c2.8-1.2 5.6-1.2 8.5 0v14c-2.9-1.2-5.7-1.2-8.5 0z" /><path d="M20.5 5.5c-2.8-1.2-5.6-1.2-8.5 0v14c2.9-1.2 5.7-1.2 8.5 0z" /></>);
export const IconGear = svg(<><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" /></>);
export const IconMenu = svg(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconPlay = svg(<path d="M8 5.5v13l11-6.5z" />, true);
export const IconPause = svg(<path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" />, true);
export const IconPrev = svg(<path d="M6 5h2v14H6zM19 5.6v12.8L9.5 12z" />, true);
export const IconNext = svg(<path d="M16 5h2v14h-2zM5 5.6v12.8L14.5 12z" />, true);
export const IconPrevSurah = svg(<><path d="M11 6L5 12l6 6M19 6l-6 6 6 6" /></>);
export const IconNextSurah = svg(<><path d="M13 6l6 6-6 6M5 6l6 6-6 6" /></>);
export const IconRepeat = svg(<><path d="M17 3.5l3 3-3 3" /><path d="M4 11.5v-1a4 4 0 014-4h12" /><path d="M7 20.5l-3-3 3-3" /><path d="M20 12.5v1a4 4 0 01-4 4H4" /></>);
export const IconTranslate = svg(<><rect x="3" y="4" width="11" height="11" rx="2" /><path d="M10 9h10a1 1 0 011 1v9a1 1 0 01-1 1h-9a1 1 0 01-1-1z" /><path d="M6 8h5M8.5 8v4" /></>);
export const IconList = svg(<><path d="M9 7h11M9 12h11M9 17h11" /><circle cx="4.5" cy="7" r=".9" /><circle cx="4.5" cy="12" r=".9" /><circle cx="4.5" cy="17" r=".9" /></>);
export const IconBookmark = svg(<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />);
export const IconBookmarkOn = svg(<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />, true);
export const IconHistory = svg(<><path d="M3.5 12a8.5 8.5 0 102.5-6" /><path d="M3 3.5V8h4.5" /><path d="M12 7.5V12l3 2" /></>);
export const IconStar = svg(<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />);
export const IconStarOn = svg(<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />, true);
export const IconLayers = svg(<><path d="M12 3.5l9 4.5-9 4.5L3 8z" /><path d="M3 12l9 4.5 9-4.5" /><path d="M3 16l9 4.5 9-4.5" /></>);
export const IconUser = svg(<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" /></>);
export const IconQuran = svg(<><path d="M3 6.5c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5v12c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z" /><path d="M12 7v12" /></>);
export const IconSpeaker = svg(<><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /></>);
export const IconBack = svg(<path d="M15 5l-7 7 7 7" />);
export const IconMore = svg(<><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>, true);
export const IconClose = svg(<path d="M6 6l12 12M18 6L6 18" />);
export const IconHome = svg(<><path d="M4 11.5L12 4.5l8 7" /><path d="M6 10v9.5h12V10" /></>);

/** The Quran Play mark: a dome with a crescent spire. */
export function Logo({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path d="M10 41V25a14 14 0 0128 0v16" />
      <path d="M6 41h36" />
      <path d="M24 11V6.5" />
      <path d="M21 13.5a4 4 0 106-3.5 3 3 0 01-6 3.5z" fill="currentColor" stroke="none" />
      <path d="M20 41v-7a4 4 0 018 0v7" />
    </svg>
  );
}
