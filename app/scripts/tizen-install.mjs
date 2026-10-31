// Installs build-wgt/QuranPlay.wgt and launches it.
//   npm run tizen:install                       # TV at TV_IP (default 192.168.1.17), Developer Mode on
//   npm run tizen:install -- --ip 192.168.1.20
//   npm run tizen:install -- --clean            # uninstall first (clears saved bookmarks/settings)
//   npm run tizen:install:emulator              # first running Tizen TV emulator
import { existsSync } from "node:fs";
import { sdbCli, tizenCli, run, arg, flag, WGT, PACKAGE_ID, APP_ID } from "./tizen-common.mjs";

if (!existsSync(WGT)) throw new Error("No package: run `npm run tizen:package` first.");
const sdb = sdbCli();

if (flag("emulator")) {
  const devices = run(sdb, ["devices"], { echo: false }).out;
  const serial = (devices.match(/^(emulator-\d+)/m) || [])[1];
  if (!serial) throw new Error("No running emulator in `sdb devices`.");
  run(tizenCli(), ["install", "-n", WGT, "-t", serial]);
  run(tizenCli(), ["run", "-p", APP_ID, "-t", serial]);
  process.exit(0);
}

const ip = arg("ip", process.env.TV_IP || "192.168.1.17");
const target = ip.includes(":") ? ip : ip + ":26101";
const conn = run(sdb, ["connect", target], { echo: false }).out;
if (!/connected/.test(conn)) throw new Error(`Can't reach the TV at ${target}. Developer Mode on, Host PC IP = this computer?\n${conn}`);

// Samsung's own install command over SDB (what TizenBrew and Samsung's tools use on TVs).
const remote = "/home/owner/share/tmp/sdk_tools/QuranPlay.wgt";
const sh = (c) => run(sdb, ["-s", target, "shell", c], { echo: false }).out;
run(sdb, ["-s", target, "push", WGT, remote], { echo: false });
if (flag("clean")) console.log(sh(`0 vd_appuninstall ${PACKAGE_ID}`).trim().split("\n").pop());
const res = sh(`0 vd_appinstall ${PACKAGE_ID} ${remote}`);
if (!/install completed/.test(res)) {
  console.log(res);
  if (/different certificate/.test(res)) console.log("Signed with another certificate: retry with --clean.");
  process.exit(1);
}
console.log("Installed on " + target);
const launch = sh(`0 was_execute ${APP_ID}`);
if (/resumed/.test(launch)) {
  console.log("Quran Play was already running and resumed the old version: exit it with the remote and open it again, or use --clean.");
} else {
  console.log("Launched " + APP_ID);
}
