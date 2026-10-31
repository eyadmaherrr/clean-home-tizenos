import { createStore, useStore } from "./store";
import { Storage } from "../services/storage/Storage";
import type { EngineName } from "../services/audio/AudioEngine";

export type RepeatMode = "off" | "ayah" | "surah";
/**
 * Full Surah: one continuous recording per surah (Quran.com), ayahs kept in sync by its
 * verified timestamps. Ayah by Ayah: one file per ayah (AlQuran Cloud).
 */
export type AudioMode = "surah" | "ayah";
export type ThemeMode = "auto" | "morning" | "day" | "evening" | "night";
export type GlassMode = "auto" | "full" | "lite";
export type ArabicSize = "medium" | "large" | "xlarge";

export interface Settings {
  reciter: string;
  translation: string;
  showTranslation: boolean;
  arabicSize: ArabicSize;
  repeat: RepeatMode;
  audioMode: AudioMode;
  /** Stop at the end of every ayah until Play is pressed (either audio mode). */
  pauseEachAyah: boolean;
  /** Carry on into the next surah when one ends. */
  continuous: boolean;
  /** Offer to continue from the last position on launch. */
  resumeLast: boolean;
  /** Ayah by Ayah: recite the Basmala before ayah 1 (not for Al-Fatiha / At-Tawbah).
   *  Full Surah recordings already include it. */
  basmala: boolean;
  theme: ThemeMode;
  glass: GlassMode;
  engine: EngineName;
}

const DEFAULTS: Settings = {
  reciter: "ar.alafasy",
  translation: "en.sahih",
  showTranslation: true,
  arabicSize: "large",
  repeat: "off",
  audioMode: "surah",
  pauseEachAyah: false,
  continuous: true,
  resumeLast: true,
  basmala: true,
  theme: "auto",
  glass: "auto",
  engine: "html5",
};

/** Bump when saved settings need a one-time fix-up on load. */
const SETTINGS_VERSION = 3;

function loadSettings(): Settings {
  const saved = Storage.get<Partial<Settings> & { v?: number; playMode?: string }>("settings", {});
  // v2: Left/Right used to change values on the Settings screen, which could switch Glass
  // Effects to Full (costly blur) by accident. Put it back on Auto once.
  if (!saved.v || saved.v < 2) delete saved.glass;
  // v3: the "stop after each ayah" playback mode became the Pause After Each Ayah toggle,
  // and Full Surah audio became the default.
  if (!saved.v || saved.v < 3) {
    if (saved.playMode === "ayah") saved.pauseEachAyah = true;
    delete saved.audioMode;
  }
  delete saved.playMode;
  delete saved.v;
  return { ...DEFAULTS, ...saved };
}

export const settingsStore = createStore<Settings>(loadSettings());
const persist = () => Storage.set("settings", { ...settingsStore.get(), v: SETTINGS_VERSION });
settingsStore.subscribe(persist);
persist();

export function useSetting<K extends keyof Settings>(key: K): Settings[K] {
  return useStore(settingsStore, (s) => s[key]);
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settingsStore.set({ [key]: value } as Partial<Settings>);
}
