import type { SurahText } from "./QuranRepository";
import { QuranRepository } from "./QuranRepository";
import { surah as surahMeta } from "./QuranMetadata";
import { Cache } from "../storage/Storage";

/** A whole surah as one recording, with each ayah's [from, to) in seconds. */
export interface SurahTrack {
  url: string;
  ayahs: { from: number; to: number }[];
}

interface QdcFile { audio_url: string; verse_timings?: { verse_key: string; timestamp_from: number; timestamp_to: number }[] }

const surahTrackMemo = new Map<string, SurahTrack>();

/**
 * Which recitation file to play. Every URL comes from AlQuran Cloud's audio edition for the
 * chosen reciter (one MP3 per ayah); nothing is constructed by hand. `audio2` is the
 * lower-bitrate mirror the API lists, used when the main file keeps failing.
 */
export interface Track {
  url: string;
  fallback?: string;
  /** -1 for the Basmala prelude, otherwise the 0-based ayah index. */
  index: number;
}

export const QuranAudioRepository = {
  ayahTrack(text: SurahText, index: number): Track | null {
    const a = text.ayahs[index];
    if (!a || !a.audio) return null;
    return { url: a.audio, fallback: a.audio2, index };
  },

  async basmalaTrack(reciter: string): Promise<Track | null> {
    const b = await QuranRepository.basmalaAudio(reciter).catch(() => null);
    return b && b.audio ? { url: b.audio, fallback: b.audio2, index: -1 } : null;
  },

  /**
   * Full-surah recording and verified per-ayah timestamps from Quran.com
   * (api.quran.com/api/qdc/audio/reciters/{id}/audio_files?chapter=N&segments=true; the
   * timestamps only come with segments). Only the per-ayah ranges are kept and cached.
   */
  async surahTrack(qdc: number, surah: number): Promise<SurahTrack> {
    const key = "qdc." + qdc + "." + surah;
    const memo = surahTrackMemo.get(key);
    if (memo) return memo;
    const cached = await Cache.get<SurahTrack>(key);
    if (cached && cached.url && cached.ayahs && cached.ayahs.length === surahMeta(surah).ayahs) {
      surahTrackMemo.set(key, cached);
      return cached;
    }
    let lastError: unknown;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(`https://api.quran.com/api/qdc/audio/reciters/${qdc}/audio_files?chapter=${surah}&segments=true`, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = (await res.json()) as { audio_files: QdcFile[] };
        const file = json.audio_files && json.audio_files[0];
        const vt = (file && file.verse_timings) || [];
        // Order by ayah number from the verse key ("18:2").
        const byAyah: { from: number; to: number }[] = [];
        vt.forEach((t) => {
          const n = parseInt(t.verse_key.split(":")[1], 10);
          byAyah[n - 1] = { from: t.timestamp_from / 1000, to: t.timestamp_to / 1000 };
        });
        if (!file || !file.audio_url || byAyah.length !== surahMeta(surah).ayahs || byAyah.some((x) => !x)) {
          throw new Error("No timed recording for surah " + surah);
        }
        const track: SurahTrack = { url: file.audio_url, ayahs: byAyah };
        surahTrackMemo.set(key, track);
        Cache.set(key, track);
        return track;
      } catch (e) {
        lastError = e;
        await new Promise((r) => setTimeout(r, 600 * (i + 1)));
      }
    }
    throw lastError;
  },

  /** Index of the ayah playing at `time` (seconds); -1 before ayah 1 (the opening Basmala). */
  ayahAt(track: SurahTrack, time: number): number {
    const a = track.ayahs;
    if (!a.length || time < a[0].from) return -1;
    let lo = 0, hi = a.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (a[mid].from <= time) lo = mid; else hi = mid - 1;
    }
    return lo;
  },

  /** Al-Fatiha's Basmala is its first ayah, and At-Tawbah has none. */
  hasBasmalaPrelude(surah: number): boolean {
    return surah !== 1 && surah !== 9;
  },
};
