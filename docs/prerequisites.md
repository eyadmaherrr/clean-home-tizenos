# Prerequisites — before you (or an agent) can install this

An AI agent (Claude Code or Codex) can do the build, signing, and install steps for you. But a
few things have to be set up **once by a person**, because they need a big SDK download or the TV
remote in your hand. Do these first, then hand the repo to the agent and say "install this on my
TV". If anything below is missing, the agent can walk you through it — point it at this file.

Checklist:

- [ ] Tizen Studio (gives `tizen` + `sdb`)
- [ ] Node.js
- [ ] yt-dlp + ffmpeg (only to regenerate the athkar audio)
- [ ] Developer Mode enabled on the TV, pointed at your computer
- [ ] TV and computer on the **same network**

---

## 1. Tizen Studio (`tizen` + `sdb`)

This is the toolchain that signs the app and talks to the TV. It's a sizeable download, which is
why an agent usually can't install it silently.

1. Download **Tizen Studio** from <https://developer.tizen.org/development/tizen-studio/download>
   (the "with IDE" or CLI package — either includes the command-line tools).
2. Run the installer and accept the defaults. Default location is `C:\tizen-studio` on Windows,
   `~/tizen-studio` on macOS/Linux.
3. Add its tools to your PATH so `tizen` and `sdb` work from any terminal:
   - **Windows:** add `C:\tizen-studio\tools` and `C:\tizen-studio\tools\ide\bin`.
   - **macOS/Linux:** add `~/tizen-studio/tools` and `~/tizen-studio/tools/ide/bin`.
4. Verify in a new terminal:
   ```bash
   sdb version
   tizen version
   ```

No Samsung account is needed — this project signs with the default Tizen distributor certificate,
which 2015–2022 TVs accept. (Newer TVs may require a Samsung-account certificate; see
`clean-home-setup.md`.)

## 2. Node.js

Needed to build the app.

- Download the **LTS** from <https://nodejs.org/> and install, or use a package manager:
  - Windows: `winget install OpenJS.NodeJS.LTS`
  - macOS: `brew install node`
  - Linux: your distro's package, or <https://github.com/nvm-sh/nvm>
- Verify: `node -v` and `npm -v`.

## 3. yt-dlp + ffmpeg (for the athkar audio)

The two recitation recordings aren't stored in the repo; `npm --prefix app run athkar:audio`
regenerates them, and it needs these two tools. Skip this only if you don't need the Athkar audio.

- **yt-dlp** — <https://github.com/yt-dlp/yt-dlp#installation>
  - Windows: `winget install yt-dlp.yt-dlp`  ·  macOS: `brew install yt-dlp`  ·  `pip install yt-dlp`
- **ffmpeg** — <https://ffmpeg.org/download.html>
  - Windows: `winget install Gyan.FFmpeg`  ·  macOS: `brew install ffmpeg`  ·  Linux: `sudo apt install ffmpeg`
- Verify: `yt-dlp --version` and `ffmpeg -version`.

## 4. Developer Mode on the TV

This has to be done with the remote — an agent can't press these buttons.

1. On the TV: **Home → Apps**. With the Apps screen open, type **1 2 3 4 5** on the remote. A
   **Developer Mode** dialog appears.
2. Turn **Developer Mode On**.
3. For **Host PC IP**, enter **your computer's IP address** on the local network (see below).
4. Press OK and **restart the TV** (power off and on).

### Find your computer's IP

- **Windows:** run `ipconfig` and read the **IPv4 Address** (e.g. `192.168.1.43`).
- **macOS:** `ipconfig getifaddr en0`
- **Linux:** `hostname -I` (first address), or `ip addr`.

### Find the TV's IP

On the TV: **Settings → General (or Connection) → Network → Network Status → IP Settings**, or
check your router's device list.

### Confirm the connection

With Developer Mode on and the TV restarted, from your computer:

```bash
sdb connect <TV_IP>:26101   # e.g. sdb connect 192.168.1.17:26101
sdb devices                 # the TV should be listed as "device"
```

If it says *connected* / lists the TV, you're ready. Hand the repo to the agent (or follow
`clean-home-setup.md`) and install.

## 5. Same network

The TV and the computer must be on the **same Wi-Fi/LAN**. A guest network, VPN, or "client
isolation" on the router will block `sdb` from reaching the TV.

---

### After this

Everything else — creating the signing certificate, building the `.wgt`, pushing it over `sdb`,
installing, and making Clean Home the home screen — is in
[`clean-home-setup.md`](clean-home-setup.md), and an agent can run those steps for you.
