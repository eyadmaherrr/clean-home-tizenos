// Fetches verified Quran metadata (surah list + juz boundaries) from AlQuran Cloud and
// writes src/assets/data/quran-meta.json. Run with `npm run data:meta`. Nothing here is
// hand-written: names, ayah counts and juz starts all come from the API response.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/assets/data/quran-meta.json");

const res = await fetch("https://api.alquran.cloud/v1/meta");
if (!res.ok) throw new Error("meta request failed: " + res.status);
const { data } = await res.json();

const surahs = data.surahs.references.map((s) => ({
  n: s.number,
  ar: s.name,
  en: s.englishName,
  meaning: s.englishNameTranslation,
  ayahs: s.numberOfAyahs,
  type: s.revelationType,
}));

// Global ayah number of each surah's first ayah (per-ayah audio is addressed globally).
let offset = 0;
for (const s of surahs) {
  s.first = offset + 1;
  offset += s.ayahs;
}

const juzs = data.juzs.references.map((j, i) => ({ n: i + 1, surah: j.surah, ayah: j.ayah }));

if (offset !== data.ayahs.count) throw new Error(`ayah total ${offset} != ${data.ayahs.count}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ source: "api.alquran.cloud/v1/meta", totalAyahs: offset, surahs, juzs }));
console.log(`wrote ${out}: ${surahs.length} surahs, ${juzs.length} juz, ${offset} ayahs`);
