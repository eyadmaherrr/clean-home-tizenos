// Creates the signing certificate and security profile used to package Quran Play.
// A Tizen author certificate + the default Tizen distributor certificate is accepted by
// 2015–2022 Samsung TVs. 2023+ TVs (Tizen 7+) need a Samsung certificate tied to the TV's
// DUID: create that in Tizen Studio's Certificate Manager and pass --profile <name> to the
// package script (or set TIZEN_PROFILE) instead.
//
//   npm run tizen:cert                 # profile "quranplay"
//   npm run tizen:cert -- --name other
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { root, tizenCli, run, arg, PROFILE } from "./tizen-common.mjs";

const name = arg("name", PROFILE);
const secretDir = join(root, ".tizen");
const pwFile = join(secretDir, name + "-password.txt");
mkdirSync(secretDir, { recursive: true });

// The password stays on this machine (.tizen/ is git-ignored) and is never printed.
// Hex only: the CLI is run through a shell on Windows and reads a leading "-" as a flag.
const password = existsSync(pwFile) ? readFileSync(pwFile, "utf8").trim() : "qp" + randomBytes(16).toString("hex");
writeFileSync(pwFile, password);

const cli = tizenCli();
const file = name + "-author";
const made = run(cli, ["certificate", "-a", name, "-f", file, "-p", password, "-n", "QuranPlay", "-c", "EG"], { echo: false });
const p12 = join(homedir(), "tizen-studio-data", "keystore", "author", file + ".p12");
if (!existsSync(p12)) throw new Error("certificate was not created: " + p12 + "\n" + made.out.split(password).join("***"));

const r = run(cli, ["security-profiles", "add", "-n", name, "-a", p12, "-p", password], { echo: false });
if (r.code !== 0 && !/already/i.test(r.out)) throw new Error("security-profiles add failed:\n" + r.out);
console.log(`Signing profile "${name}" ready (author certificate ${p12}).`);
