# Agent guide — Quran TV Home

This repo turns a Samsung Tizen TV's home screen into **Clean Home** (a custom launcher) and
adds **Quran Play** (a Quran + Athkar + Prayer-Times app) to it. Read this file before changing
anything; it is the shared brief for Claude Code and Codex.

## Layout

```
launcher/   Clean Home — a static Tizen web app (the custom home screen). Plain HTML/CSS/JS,
            no build step. Edit main.js / style.css / index.html / config.js directly.
app/        Quran Play — a React + TypeScript + Vite app, packaged as a signed Tizen .wgt.
docs/       TV setup: Developer Mode, signing, install over sdb, home-screen takeover.
```

## Before you build: prerequisites

An agent can do the build/sign/install, but some one-time setup needs a person (Tizen Studio
install, Developer Mode on the TV with the remote, Node/yt-dlp/ffmpeg). Before running any build
or `sdb` command, check these are in place; if not, walk the user through
[`docs/prerequisites.md`](docs/prerequisites.md) step by step rather than assuming they exist.
Confirm the TV is reachable with `sdb connect <TV_IP>:26101` first.

## The two tasks this repo exists for

1. **Make Clean Home the home screen.** See `docs/clean-home-setup.md`. In short: enable
   Developer Mode on the TV, sign + install `launcher/` as a Tizen app, then point the TV's
   boot/home app at it via vconf keys over `sdb`.
2. **Add / keep Quran Play on the dock.** The launcher already pins it: `FIXED_DOCK` and `LOGOS`
   in `launcher/main.js` reference the app id `QuranPlay1.QuranPlay` with a white logo at
   `launcher/icons/apps/quranplay-white.png`. Build + install `app/` so that id exists on the TV.

## Editing the home screen (launcher/)

- The dock is `FIXED_DOCK` in `launcher/main.js` — an array of `{ id, name }` using each app's
  real Tizen application id (from `0 vd_applist` on the TV). `LOGOS` maps an id to a bundled
  image in `launcher/icons/apps/`; add `LOGO_INVERT[id] = true` to force a dark logo white.
- There is **no build step** for the launcher. Preview it by serving `launcher/` over HTTP and
  opening it in a browser at 1920×1080. Re-serve on a fresh port each time — the Tizen web
  runtime and plain browsers both cache `main.js`/`style.css` aggressively.
- Package + install: see "Packaging the launcher" below.

## Editing the app (app/)

- Home-screen tiles: `app/src/screens/Home/HomeScreen.tsx` (`TILES`).
- Screens live in `app/src/screens/`, shared audio in `app/src/services/audio/`
  (one `AudioManager`; `HTML5AudioEngine` is the default, `TizenAVPlayEngine` wraps AVPlay and
  falls back to HTML5 for files bundled in the app).
- Athkar data: `app/src/data/` (Hisn al-Muslim + morning/evening text). Recitation audio is
  **not committed** — run `npm --prefix app run athkar:audio` to regenerate it (needs yt-dlp +
  ffmpeg). See `app/public/athkar/README.md`.
- Always typecheck: `npm --prefix app run typecheck`.

## TV constraints (verified on Tizen 6.0 / Chromium 76; older 2020 sets are Chromium 69)

- The Vite build targets Chromium 69, so optional chaining / nullish are transpiled. Do not rely
  on them at runtime. Avoid CSS `inset` and `aspect-ratio`; flex `gap` is unreliable (use
  margins). `backdrop-filter` works but is costly — glass blur is disabled on all Tizen TVs.
- `localStorage` and `IndexedDB` persist across restarts. A running app only *resumes* on
  re-launch — uninstall+reinstall (or exit it) to force new code to load.
- Keep scrolling screens cheap: no text-shadow on large repainted text, keep the frequently
  updating progress bar on its own layer. (The Athkar list regressed on this and was fixed.)

## Build / sign / package / install

Install the Tizen Studio CLI (bundles its own JDK) and create a signing profile once; a plain
Tizen author cert + the default distributor cert is accepted by 2015–2022 TVs (no Samsung
account needed). Keep cert passwords out of git (`.tizen/` is ignored).

```bash
# one-time: signing profile for the app
npm --prefix app run tizen:cert

# Quran Play: build → sign .wgt → install over sdb (TV in Developer Mode)
TV_IP=192.168.1.x npm --prefix app run deploy
#   or step by step:
npm --prefix app run build
npm --prefix app run tizen:package
TV_IP=192.168.1.x npm --prefix app run tizen:install
```

### Packaging the launcher

The launcher is signed and installed the same way (adjust to your profile name and Tizen CLI
path). It has no build output — you package the `launcher/` folder directly:

```bash
tizen package -t wgt -s <your-profile> -o build/ -- launcher
# push the resulting .wgt to the TV and install it:
sdb -s 192.168.1.x:26101 push build/*.wgt /home/owner/share/tmp/sdk_tools/CleanHome.wgt
sdb -s 192.168.1.x:26101 shell "0 vd_appinstall <launcher-package-id> /home/owner/share/tmp/sdk_tools/CleanHome.wgt"
```

Then make it the home screen — see `docs/clean-home-setup.md`.

## House rules

- **Never commit secrets.** No Spotify tokens, cert passwords, `.p12`, or signing XML. `config.js`
  stays secret-free; real keys go in a local `config.local.js` (git-ignored) or env.
- Don't commit build output (`app/dist`, `app/build-wgt`, `*.wgt`) or the athkar `.mp3`s.
- Quran and Athkar **text/audio must stay verified** — never fabricate Quran text or timings, and
  don't hand-write athkar wording; use the bundled datasets and cite the source.
