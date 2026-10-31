// Regenerates the two bundled athkar recordings (not committed to the repo).
//   npm run athkar:audio
// Requires yt-dlp and ffmpeg on PATH. Downloads each video's audio-only stream and
// transcodes to a 64 kbps mono MP3 under public/athkar/.
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "athkar");
const tmp = join(root, ".athkar-tmp");

// Mishary Alafasy, official channel. kind -> YouTube id.
const SOURCES = [
  { kind: "morning", id: "OIWahnI8rSI" },
  { kind: "evening", id: "TGtdZmxsM5Q" },
];

function has(cmd) {
  try { execFileSync(cmd, ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

if (!has("yt-dlp")) throw new Error("yt-dlp not found on PATH. Install from https://github.com/yt-dlp/yt-dlp");
if (!has("ffmpeg")) throw new Error("ffmpeg not found on PATH. Install from https://ffmpeg.org/");

mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

for (const { kind, id } of SOURCES) {
  const m4a = join(tmp, id + ".m4a");
  const mp3 = join(out, "athkar-" + kind + ".mp3");
  console.log("Downloading", kind, "(" + id + ")…");
  execFileSync("yt-dlp", ["-q", "-f", "140/bestaudio[ext=m4a]/bestaudio", "-o", m4a, id], { stdio: "inherit" });
  console.log("Transcoding", kind, "→", mp3);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", m4a, "-vn", "-ac", "1", "-ar", "44100", "-b:a", "64k", mp3], { stdio: "inherit" });
}

rmSync(tmp, { recursive: true, force: true });
console.log("Done. Bundled:", existsSync(join(out, "athkar-morning.mp3")) && existsSync(join(out, "athkar-evening.mp3")));
