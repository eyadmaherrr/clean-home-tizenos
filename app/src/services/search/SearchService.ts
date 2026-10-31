import { SURAHS, type SurahMeta } from "../quran/QuranMetadata";
import { QuranRepository } from "../quran/QuranRepository";
import { Storage } from "../storage/Storage";

/** Surah search (offline, by number / English name / meaning / Arabic name) and ayah keyword
 *  search in the chosen translation (online, AlQuran Cloud). */
function norm(s: string): string {
  return s.toLowerCase().replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/[-'`’_.]/g, "").replace(/\s+/g, " ").trim();
}

function latin(s: string): string {
  // "Al-Faatiha" / "al fatiha" / "fatiha" all match: drop the article and doubled vowels.
  return norm(s).replace(/^(al|an|ar|as|ash|at|az|ad|adh)\s?/, "").replace(/([aeiou])\1+/g, "$1");
}

export const SearchService = {
  surahs(query: string): SurahMeta[] {
    const q = query.trim();
    if (!q) return [];
    const n = parseInt(q, 10);
    if (String(n) === q && n >= 1 && n <= 114) return [SURAHS[n - 1]];
    const lq = latin(q), nq = norm(q);
    return SURAHS.filter((s) =>
      latin(s.en).indexOf(lq) >= 0 || norm(s.meaning).indexOf(nq) >= 0 || norm(s.ar).indexOf(nq) >= 0,
    ).slice(0, 12);
  },

  ayahs(query: string, translation: string) {
    return QuranRepository.search(query, translation);
  },

  recent(): string[] {
    return Storage.get<string[]>("searches", []);
  },

  remember(query: string): void {
    const q = query.trim();
    if (!q) return;
    Storage.set("searches", [q].concat(this.recent().filter((x) => x.toLowerCase() !== q.toLowerCase())).slice(0, 8));
  },
};
