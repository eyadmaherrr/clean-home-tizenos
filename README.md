# Quran TV Home

Turn a Samsung Tizen TV's home screen into a clean, Apple-lock-screen-style launcher and add a
full Quran + Athkar + Prayer-Times app to it.

Two parts, one repo:

| Folder      | What it is | Build |
|-------------|------------|-------|
| `launcher/` | **Clean Home** — a custom TV home screen (clock, weather, prayer-time widget, app dock over a cinematic wallpaper). Static HTML/CSS/JS. | none |
| `app/`      | **Quran Play** — Quran playback (full-surah & ayah-by-ayah), Morning/Evening Athkar with audio, all of Hisn al-Muslim, and today's prayer times. React + TypeScript + Vite, packaged as a signed Tizen `.wgt`. | `npm --prefix app run build` |

Clean Home pins Quran Play on its dock out of the box.

## Quick start

1. **Prerequisites (one-time, by a person):** Tizen Studio (`tizen` + `sdb`), Node.js,
   `yt-dlp` + `ffmpeg` (for the athkar audio), and Developer Mode enabled on the TV.
   **Step-by-step help for each is in [`docs/prerequisites.md`](docs/prerequisites.md)** — do
   these first, then an agent can take over the build/install.
2. **TV:** enable Developer Mode and point it at this PC (see
   [`docs/clean-home-setup.md`](docs/clean-home-setup.md)).
3. **App deps + athkar audio:**
   ```bash
   npm --prefix app install
   npm --prefix app run athkar:audio   # fetches the two recitations (not committed)
   ```
4. **Install both on the TV:**
   ```bash
   npm --prefix app run tizen:cert                 # one-time signing profile
   TV_IP=192.168.1.x npm --prefix app run deploy   # build + sign + install Quran Play
   # launcher: see docs/clean-home-setup.md §5–6
   ```

Full instructions, signing, and the home-screen takeover are in
[`docs/clean-home-setup.md`](docs/clean-home-setup.md). Editing guidance for both parts is in
[`AGENTS.md`](AGENTS.md) (read by Codex and, via `CLAUDE.md`, by Claude Code).

## Working with AI agents

This repo is set up for Claude Code (`CLAUDE.md`) and Codex (`AGENTS.md`). Point either at the
repo and ask it to change the home screen (`launcher/main.js` dock) or the app
(`app/src/screens/`); the agent files explain the layout, the TV's browser constraints, and the
build/sign/install flow.

## What is not in this repo

- **Athkar recitations** (`app/public/athkar/*.mp3`) — third-party audio; regenerate with
  `npm --prefix app run athkar:audio`.
- **Signing material** (`.tizen/`, `*.p12`, Tizen signature XML) — stays on your machine.
- **Secrets** — `config.js` holds none; any Spotify token or key goes in a local, git-ignored
  override.

## Credits & licensing

- The launcher is derived from and inspired by
  [DavidNgugi/samsung-tv-unlock](https://github.com/DavidNgugi/samsung-tv-unlock). That project
  does not publish a license file; this repository re-publishes a heavily modified launcher in
  good faith for personal use — check the upstream project's terms before reusing it.
- Background photos are from [Unsplash](https://unsplash.com/) (free to use under the Unsplash
  License) and bundled because the TV can't reach Unsplash's CDN at runtime.
- Fonts: Amiri Quran and Inter (open-source licenses, see their respective projects).
- Quran text/audio and prayer times are fetched from public APIs
  (alquran.cloud, quran.com / quranicaudio.com, AlAdhan). Athkar text is Hisn al-Muslim.

This is a personal, non-commercial project. No warranty. Customizing a TV via Developer Mode is
at your own risk.
