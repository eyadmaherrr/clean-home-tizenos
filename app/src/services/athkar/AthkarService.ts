import data from "../../data/athkar.json";
import morningEvening from "../../data/morning-evening.json";
import { createStore, useStore } from "../../state/store";

/**
 * Hisn al-Muslim (حصن المسلم), Arabic text exactly as published by the official
 * hisnmuslim.com API (api/ar/husn_ar.json and its chapter files), bundled so the screens
 * work offline. Nothing here is written by hand.
 */
export interface Dhikr { ar: string; n: number }
export interface AthkarChapter { id: number; t: string; items: Dhikr[] }

export const CHAPTERS = data as AthkarChapter[];

const byId = new Map<number, AthkarChapter>();
CHAPTERS.forEach((c) => byId.set(c.id, c));

export function chapter(id: number): AthkarChapter {
  return byId.get(id) || CHAPTERS[0];
}

/**
 * Morning and evening athkar as Mishary Alafasy recites them in the two recordings bundled in
 * public/athkar (from his official YouTube channel), in the order he recites them. The text is
 * Hisn al-Muslim's (chapter 27); where the evening wording differs (أمسينا …) it is the
 * evening text from the azkar-db dataset (github.com/osamayy/azkar-db).
 */
export type AthkarTime = "morning" | "evening";
export interface AthkarRecording { title: string; audio: string; source: string; items: string[] }
export const RECORDINGS = morningEvening as Record<AthkarTime, AthkarRecording>;

interface AthkarState { time: AthkarTime; chapter: number; index: number }

/** Which recording, and which Hisn al-Muslim chapter and dhikr, the screens show. */
export const athkarStore = createStore<AthkarState>({ time: "morning", chapter: CHAPTERS[0].id, index: 0 });

export function useAthkar<T>(select: (s: AthkarState) => T): T {
  return useStore(athkarStore, select);
}

/** Folds the spellings people type into one form: no tashkeel or tatweel, one alef,
 *  ة→ه, ى→ي, ؤ/ئ→ء. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^ء-يa-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

interface Indexed { chapter: AthkarChapter; title: string; items: string[] }
let index: Indexed[] | null = null;

function searchIndex(): Indexed[] {
  if (!index) {
    index = CHAPTERS.map((c) => ({ chapter: c, title: normalizeArabic(c.t), items: c.items.map((d) => normalizeArabic(d.ar)) }));
  }
  return index;
}

export interface AthkarHit { chapter: AthkarChapter; index: number }

export const AthkarService = {
  /** Chapters whose title matches, then individual athkar whose text matches (every word). */
  search(query: string, limit = 60): { chapters: AthkarChapter[]; athkar: AthkarHit[] } {
    const words = normalizeArabic(query).split(" ").filter(Boolean);
    if (!words.length) return { chapters: [], athkar: [] };
    const has = (text: string) => words.every((w) => text.indexOf(w) >= 0);
    const chapters: AthkarChapter[] = [];
    const athkar: AthkarHit[] = [];
    searchIndex().forEach((x) => {
      if (has(x.title)) chapters.push(x.chapter);
      x.items.forEach((t, i) => {
        if (athkar.length < limit && has(t)) athkar.push({ chapter: x.chapter, index: i });
      });
    });
    return { chapters, athkar };
  },
};
