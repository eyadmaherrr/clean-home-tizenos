import type { Ayah, SurahText } from "./QuranRepository";

/**
 * Keeps the displayed ayah in step with the recitation.
 *
 * Audio is one file per ayah, so ayah-level sync is exact: the ayah on screen is the file that
 * is playing. Word-level highlighting needs verified per-word timestamps for the exact
 * recording; none are published for these files, so `words` stays null rather than guessing.
 */
export interface SyncView {
  /** Ayah on screen, or null while the Basmala prelude plays. */
  ayah: Ayah | null;
  showBasmala: boolean;
  basmala: string;
  /** 1-based ayah number for labels ("Ayah 3 of 110"). */
  number: number;
  total: number;
  /** 0..1 through the current ayah. */
  ayahProgress: number;
  /** 0..1 through the surah, by ayah position. */
  surahProgress: number;
  words: null;
}

export const AyahSyncEngine = {
  view(text: SurahText | null, index: number, time: number, duration: number): SyncView {
    const total = text ? text.ayahs.length : 0;
    const prelude = index < 0;
    const i = Math.max(0, index);
    const ayahProgress = duration > 0 ? Math.min(1, time / duration) : 0;
    return {
      ayah: text && !prelude ? text.ayahs[i] || null : null,
      showBasmala: prelude,
      basmala: text ? text.basmala : "",
      number: i + 1,
      total,
      ayahProgress,
      surahProgress: total ? Math.min(1, (prelude ? 0 : i + ayahProgress) / total) : 0,
      words: null,
    };
  },
};
