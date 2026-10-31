// Packages dist/ as a signed Tizen .wgt: build-wgt/QuranPlay.wgt.
//   npm run tizen:package                       # signs with profile "quranplay" (TIZEN_PROFILE)
//   npm run tizen:package -- --profile cleanhome
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { root, pkg, tizenCli, run, arg, WGT, PROFILE } from "./tizen-common.mjs";

const profile = arg("profile", PROFILE);
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) throw new Error("dist/ is empty: run `npm run build` first.");

const stage = join(root, ".tizen", "stage");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(dist, stage, { recursive: true });

const config = readFileSync(join(root, "tizen", "config.xml"), "utf8")
  .replace(/(<widget[^>]*\sversion=")[^"]*(")/, `$1${pkg.version}$2`);
writeFileSync(join(stage, "config.xml"), config);
cpSync(join(root, "tizen", "icon.png"), join(stage, "icon.png"));

const out = join(root, ".tizen", "out");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const r = run(tizenCli(), ["package", "-t", "wgt", "-s", profile, "-o", out, "--", stage]);
const made = existsSync(out) ? readdirSync(out).filter((f) => f.endsWith(".wgt")) : [];
if (r.code !== 0 || !made.length) throw new Error(`tizen package failed (profile "${profile}"). Run npm run tizen:cert first?`);

// `tizen package` happily writes an unsigned .wgt when the profile is missing; the TV then
// refuses it with "Check certificate error". Fail here instead.
const bytes = readFileSync(join(out, made[0]));
if (!bytes.includes("author-signature.xml") || !bytes.includes("signature1.xml")) {
  throw new Error(`The package is not signed: does the "${profile}" profile exist? Run npm run tizen:cert.`);
}

mkdirSync(dirname(WGT), { recursive: true });
rmSync(WGT, { force: true });
renameSync(join(out, made[0]), WGT);
console.log(`\nSigned ${WGT} (v${pkg.version}, profile "${profile}")`);
