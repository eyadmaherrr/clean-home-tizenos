# Clean Home setup on a Samsung Tizen TV

This covers enabling Developer Mode, signing, installing both apps over `sdb`, and pointing the
TV's home screen at the launcher. Tested on a 2021 Tizen 6.0 set; 2020 Tizen 5.5 sets behave
similarly but the home-screen takeover depends on firmware and is not guaranteed.

Replace `TV_IP` with your TV's address and `PC_IP` with this computer's.

## 1. Toolchain

- Install **Tizen Studio** (CLI is enough; it bundles its own JDK). You get `tizen` and `sdb`.
- No Samsung account or device-unique id is needed for 2015–2022 TVs: a plain Tizen **author
  certificate** plus the **default distributor certificate** is accepted.

## 2. Developer Mode on the TV

1. Open Apps, type `12345` on the remote to reveal Developer Mode.
2. Turn it **On** and set **Host PC IP** to `PC_IP`. Restart the TV.
3. Connect: `sdb connect TV_IP:26101` (should report *connected*).

## 3. Signing profile (once)

```bash
# Quran Play has a helper that creates the cert + profile and keeps the password in app/.tizen/
npm --prefix app run tizen:cert
```

Or create one by hand with `tizen certificate` + `tizen security-profiles add`. Keep the
password local — `.tizen/` and `*.p12` are git-ignored. **Never commit signing material.**

## 4. Install Quran Play

```bash
TV_IP=TV_IP npm --prefix app run deploy
```

This builds, signs `app/build-wgt/QuranPlay.wgt`, pushes it over `sdb`, and installs with
`0 vd_appinstall`. A running app only *resumes* on relaunch, so after code changes use
`--clean` (uninstall first) or exit it on the TV.

## 5. Install the launcher

```bash
tizen package -t wgt -s <your-profile> -o build/ -- launcher
sdb -s TV_IP:26101 push build/*.wgt /home/owner/share/tmp/sdk_tools/CleanHome.wgt
sdb -s TV_IP:26101 shell "0 vd_appinstall <launcher-package-id> /home/owner/share/tmp/sdk_tools/CleanHome.wgt"
```

The launcher's package/app id come from `launcher/config.xml`.

## 6. Make the launcher the home screen

On this firmware the launcher is shown on boot/wake by pointing the relevant vconf keys at its
app id (`home_appid`, `booting_appid_backup`, `first_screen/type`). This needs the SDK-user
foothold that Developer Mode exposes; the exact keys and method vary by model and firmware, so
treat this as the model-specific step and test before relying on it.

### Known limits (2021 AU7000, likely similar elsewhere)

- The **physical Home button can't be fully taken over** — Smart Hub overrides the key filter, so
  pressing Home still opens Samsung's launcher. Clean Home shows on boot/wake.
- Preloaded/store apps **can't be uninstalled over `sdb`** (only via the on-TV Apps → Delete).
- Rooting was considered and rejected: it doesn't give a persistent home-screen replacement.

## Debugging on the TV

The screen can't be captured over `sdb`. Set `debugBeacon` in `launcher/config.js` (or add a
similar beacon in the app) to a LAN URL like `http://PC_IP:8792` and run a tiny HTTP server there
to receive perf/capability payloads. Leave it empty for normal use.

## Verified TV capabilities (probe)

Tizen 6.0, Chromium 76, 1920×1080. Reachable from the TV: AlAdhan, Open-Meteo, Quran APIs
(alquran.cloud, quran.com, quranicaudio.com), cdn.islamic.network. The TV **cannot** reach
`images.unsplash.com` — that's why wallpapers are bundled, not fetched. HTML5 Audio plays remote
MP3s; AVPlay is present but can't open files packaged inside the app (those use HTML5 instead).
