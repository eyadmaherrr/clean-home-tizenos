// Shared helpers for the Tizen scripts: locating Samsung's CLI tools and running them.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
export const PACKAGE_ID = "QuranPlay1";
export const APP_ID = "QuranPlay1.QuranPlay";
export const WGT = join(root, "build-wgt", "QuranPlay.wgt");
export const PROFILE = process.env.TIZEN_PROFILE || "quranplay";
const win = process.platform === "win32";

function studio() {
  const bases = [process.env.TIZEN_STUDIO, join(homedir(), "tizen-studio"), join(homedir(), "tizen-sdk"), "C:\\tizen-studio"];
  for (const b of bases) if (b && existsSync(join(b, "tools"))) return b;
  throw new Error("Tizen Studio / Tizen SDK CLI not found. Install it or set TIZEN_STUDIO.");
}

export function tizenCli() {
  return join(studio(), "tools", "ide", "bin", win ? "tizen.bat" : "tizen");
}

export function sdbCli() {
  return join(studio(), "tools", win ? "sdb.exe" : "sdb");
}

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: win && cmd.endsWith(".bat"), ...opts });
  const out = (r.stdout || "") + (r.stderr || "");
  if (opts.echo !== false) process.stdout.write(out);
  return { code: r.status, out };
}

export function arg(name, fallback) {
  const i = process.argv.indexOf("--" + name);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

export function flag(name) {
  return process.argv.includes("--" + name);
}
