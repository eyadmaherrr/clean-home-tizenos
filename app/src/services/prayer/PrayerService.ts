import { Storage } from "../storage/Storage";

/**
 * Today's prayer times from AlAdhan (api.aladhan.com, no key), method 5 (Egyptian General
 * Authority of Survey) — the same source and method as the TV's home screen. The location
 * comes from ipapi.co once and is remembered; Cairo is the fallback.
 */
export interface Place { lat: number; lon: number; city: string }
export interface PrayerDay {
  date: string;
  times: Record<PrayerKey, string>;
  hijri: string;
  weekday: string;
}

export type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export const PRAYERS: { key: PrayerKey; en: string; ar: string; prayer: boolean }[] = [
  { key: "Fajr", en: "Fajr", ar: "الفجر", prayer: true },
  { key: "Sunrise", en: "Sunrise", ar: "الشروق", prayer: false },
  { key: "Dhuhr", en: "Dhuhr", ar: "الظهر", prayer: true },
  { key: "Asr", en: "Asr", ar: "العصر", prayer: true },
  { key: "Maghrib", en: "Maghrib", ar: "المغرب", prayer: true },
  { key: "Isha", en: "Isha", ar: "العشاء", prayer: true },
];

const CAIRO: Place = { lat: 30.0444, lon: 31.2357, city: "Cairo" };
const METHOD = 5;

function pad(n: number): string { return n < 10 ? "0" + n : "" + n; }

export function dayKey(d: Date): string {
  return pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear();
}

async function getJson<T>(url: string, ms = 8000): Promise<T> {
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = window.setTimeout(() => ctl && ctl.abort(), ms);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(t);
  }
}

async function place(): Promise<Place> {
  const saved = Storage.get<Place | null>("place", null);
  if (saved) return saved;
  try {
    const g = await getJson<{ latitude?: number; longitude?: number; city?: string }>("https://ipapi.co/json/", 5000);
    if (g.latitude != null && g.longitude != null) {
      const p = { lat: g.latitude, lon: g.longitude, city: g.city || "" };
      Storage.set("place", p);
      return p;
    }
  } catch { /* fall back to Cairo */ }
  return CAIRO;
}

interface AladhanDay {
  data: {
    timings: Record<string, string>;
    date: { hijri: { day: string; month: { ar: string; en: string }; year: string; weekday: { ar: string } }; gregorian: { weekday: { en: string } } };
  };
}

/** "17:09 (EET)" → "17:09". */
function hhmm(s: string): string {
  return String(s).split(" ")[0];
}

export const PrayerService = {
  /** Cached for the day, so reopening the screen is instant and works offline. */
  async today(): Promise<{ place: Place; day: PrayerDay }> {
    const p = await place();
    const key = dayKey(new Date());
    const cached = Storage.get<{ place: Place; day: PrayerDay } | null>("prayer", null);
    if (cached && cached.day.date === key && cached.place.lat === p.lat && cached.place.lon === p.lon) return cached;
    const d = await getJson<AladhanDay>(
      "https://api.aladhan.com/v1/timings/" + key + "?latitude=" + p.lat + "&longitude=" + p.lon + "&method=" + METHOD);
    const t = d.data.timings;
    const h = d.data.date.hijri;
    const day: PrayerDay = {
      date: key,
      times: { Fajr: hhmm(t.Fajr), Sunrise: hhmm(t.Sunrise), Dhuhr: hhmm(t.Dhuhr), Asr: hhmm(t.Asr), Maghrib: hhmm(t.Maghrib), Isha: hhmm(t.Isha) },
      hijri: h.day + " " + h.month.en + " " + h.year + " AH",
      weekday: d.data.date.gregorian.weekday.en,
    };
    const result = { place: p, day };
    Storage.set("prayer", result);
    return result;
  },
};

export function minutesOf(hm: string): number {
  const p = hm.split(":");
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

export function to12(hm: string): { time: string; ap: string } {
  const p = hm.split(":");
  const h = parseInt(p[0], 10);
  return { time: (h % 12 || 12) + ":" + p[1], ap: h < 12 ? "AM" : "PM" };
}
