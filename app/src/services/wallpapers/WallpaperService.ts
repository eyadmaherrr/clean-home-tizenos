import morning from "../../assets/wallpapers/morning.jpg";
import day from "../../assets/wallpapers/day.jpg";
import evening from "../../assets/wallpapers/evening.jpg";
import night from "../../assets/wallpapers/night.jpg";
import mosque1 from "../../assets/images/mosque-1.jpg";
import mosque2 from "../../assets/images/mosque-2.jpg";
import mosque3 from "../../assets/images/mosque-3.jpg";
import mosque4 from "../../assets/images/mosque-4.jpg";
import mosque5 from "../../assets/images/mosque-5.jpg";
import mosque6 from "../../assets/images/mosque-6.jpg";
import type { ThemeMode } from "../../state/settings";

/** Cinematic mountain backgrounds by time of day, and the mosque art used on cards. */
export type Phase = "morning" | "day" | "evening" | "night";

const WALLPAPERS: Record<Phase, string> = { morning, day, evening, night };
const MOSQUES = [mosque1, mosque2, mosque3, mosque4, mosque5, mosque6];

export const WallpaperService = {
  phase(mode: ThemeMode, date = new Date()): Phase {
    if (mode !== "auto") return mode;
    const h = date.getHours();
    if (h >= 5 && h < 10) return "morning";
    if (h >= 10 && h < 16) return "day";
    if (h >= 16 && h < 19) return "evening";
    return "night";
  },
  wallpaper(phase: Phase): string {
    return WALLPAPERS[phase];
  },
  /** Stable artwork for a surah's cards. */
  art(surah: number): string {
    return MOSQUES[(surah - 1) % MOSQUES.length];
  },
};
