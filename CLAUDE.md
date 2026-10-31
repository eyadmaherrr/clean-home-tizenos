@AGENTS.md

## Claude Code notes

- The repo has two independent parts: `launcher/` (static JS, no build) and `app/` (React + Vite,
  builds to a signed Tizen `.wgt`). Run `app` commands with `npm --prefix app run <script>`.
- Before changing the app, typecheck with `npm --prefix app run typecheck`.
- Preview the launcher or the built app by serving the folder over HTTP at 1920×1080 on a **fresh
  port each time** (the Tizen runtime and browsers cache `main.js` / the bundle hard).
- Reading the TV back is hard (the screen can't be screenshotted over `sdb`); verify designs in a
  browser pane, and use the optional `debugBeacon` config for on-TV diagnostics.
