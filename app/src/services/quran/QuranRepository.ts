import { Cache } from "../storage/Storage";
import { surah as surahMeta } from "./QuranMetadata";

/**
 * Quran text, translation and per-ayah recitation URLs, from AlQuran Cloud in one request:
 *   /v1/surah/{n}/editions/quran-uthmani,{translation},{reciter}
 * Ported from nur-app's verified service:
 *  - editions are matched by identifier/format, not `edition.type` (several audio editions are
 *    mislabelled "translation" there);
 *  - ayah 1 of every surah except Al-Fatiha and At-Tawbah starts with the Basmala, which is
 *    split off so it can be shown (and recited) separately.
 * Cache-first: a stored copy is returned at once and refreshed in the background.
 */
const API = "https://api.alquran.cloud/v1";

export interface Ayah {
  /** Number within the surah (1-based). */
  n: number;
  ar: string;
  tr: string;
  audio?: string;
  /** Lower-bitrate mirror, used when the main file fails. */
  audio2?: string;
  juz: number;
  page: number;
}

export interface SurahText {
  n: number;
  translation: string;
  reciter: string;
  /** Basmala as printed at the head of this surah ("" for 1 and 9). */
  basmala: string;
  ayahs: Ayah[];
}

interface EditionAyah { number: number; numberInSurah: number; text: string; audio?: string; audioSecondary?: string[]; juz: number; page: number }
interface EditionBlock { edition: { identifier: string; format: string; type: string }; ayahs: EditionAyah[] }

const memo = new Map<string, SurahText>();
const inflight = new Map<string, Promise<SurahText>>();

function key(n: number, translation: string, reciter: string) {
  return `surah.${n}.${translation}.${reciter}`;
}

function splitBasmala(surahNumber: number, text: string): { basmala: string; rest: string } {
  if (surahNumber === 1 || surahNumber === 9) return { basmala: "", rest: text };
  const words = text.split(/\s+/);
  // A Basmala is four words starting with "بِسْمِ" (tolerating diacritic variants).
  if (words.length > 4 && /^بِسْم/.test(words[0])) {
    return { basmala: words.slice(0, 4).join(" "), rest: words.slice(4).join(" ") };
  }
  return { basmala: "", rest: text };
}

async function fetchJson<T>(url: string, tries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return (await res.json()) as T;
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastError;
}

async function load(n: number, translation: string, reciter: string): Promise<SurahText> {
  const json = await fetchJson<{ code: number; data: EditionBlock[] }>(
    `${API}/surah/${n}/editions/quran-uthmani,${translation},${reciter}`);
  if (json.code !== 200 || !json.data || json.data.length < 2) throw new Error("Could not load this surah.");
  const blocks = json.data;
  const arabic = blocks.filter((b) => b.edition.identifier === "quran-uthmani")[0] || blocks.filter((b) => b.edition.format === "text")[0] || blocks[0];
  const trans = blocks.filter((b) => b.edition.identifier === translation)[0]
    || blocks.filter((b) => b.edition.format === "text" && b.edition.identifier !== "quran-uthmani")[0] || blocks[1];
  const audio = blocks.filter((b) => b.edition.identifier === reciter)[0] || blocks.filter((b) => b.edition.format === "audio")[0];
  if (!arabic || !trans) throw new Error("Could not load this surah.");
  if (arabic.ayahs.length !== surahMeta(n).ayahs) throw new Error("Unexpected ayah count for surah " + n);

  let basmala = "";
  const ayahs: Ayah[] = arabic.ayahs.map((a, i) => {
    let ar = a.text;
    if (i === 0) {
      const s = splitBasmala(n, a.text);
      basmala = s.basmala;
      ar = s.rest;
    }
    const au = audio && audio.ayahs[i];
    return {
      n: a.numberInSurah,
      ar,
      tr: (trans.ayahs[i] && trans.ayahs[i].text) || "",
      audio: au && au.audio,
      audio2: au && au.audioSecondary && au.audioSecondary[0],
      juz: a.juz,
      page: a.page,
    };
  });
  const text: SurahText = { n, translation, reciter, basmala, ayahs };
  memo.set(key(n, translation, reciter), text);
  Cache.set(key(n, translation, reciter), text);
  return text;
}

export const QuranRepository = {
  /** In-memory copy only (instant render), or null. */
  peek(n: number, translation: string, reciter: string): SurahText | null {
    return memo.get(key(n, translation, reciter)) || null;
  },

  async getSurah(n: number, translation: string, reciter: string): Promise<SurahText> {
    const k = key(n, translation, reciter);
    const m = memo.get(k);
    if (m) return m;
    const pending = inflight.get(k);
    if (pending) return pending;
    const p = (async () => {
      const cached = await Cache.get<SurahText>(k);
      if (cached && cached.ayahs && cached.ayahs.some((a) => a.audio)) {
        memo.set(k, cached);
        load(n, translation, reciter).catch(() => undefined);   // quiet refresh
        return cached;
      }
      return load(n, translation, reciter);
    })();
    inflight.set(k, p);
    try {
      return await p;
    } finally {
      inflight.delete(k);
    }
  },

  /** The reciter's own recording of the Basmala (Al-Fatiha 1:1), played before ayah 1. */
  async basmalaAudio(reciter: string): Promise<{ audio?: string; audio2?: string }> {
    const k = "basmala." + reciter;
    const cached = await Cache.get<{ audio?: string; audio2?: string }>(k);
    if (cached && cached.audio) return cached;
    const json = await fetchJson<{ code: number; data: { audio?: string; audioSecondary?: string[] } }>(`${API}/ayah/1/${reciter}`);
    const v = { audio: json.data.audio, audio2: json.data.audioSecondary && json.data.audioSecondary[0] };
    if (v.audio) Cache.set(k, v);
    return v;
  },

  /** Keyword search across a translation (online). */
  async search(keyword: string, translation: string): Promise<{ surah: number; ayah: number; text: string }[]> {
    const q = encodeURIComponent(keyword.trim());
    if (!q) return [];
    const json = await fetchJson<{ code: number; data: { matches: { surah: { number: number }; numberInSurah: number; text: string }[] } }>(
      `${API}/search/${q}/all/${translation}`, 2).catch(() => null);
    if (!json || json.code !== 200 || !json.data) return [];
    return json.data.matches.slice(0, 40).map((m) => ({ surah: m.surah.number, ayah: m.numberInSurah, text: m.text }));
  },
};
