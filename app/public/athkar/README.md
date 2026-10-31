# Athkar audio (not committed)

The Morning and Evening Athkar screens play two recordings by Mishary Rashid Alafasy:

- `athkar-morning.mp3` — from <https://youtu.be/OIWahnI8rSI> (أذكار الصباح)
- `athkar-evening.mp3` — from <https://youtu.be/TGtdZmxsM5Q> (أذكار المساء)

These files are **not** stored in this repository (they are third-party recitation audio).
Generate them locally before building:

```bash
npm --prefix app run athkar:audio
```

The script needs [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) and [`ffmpeg`](https://ffmpeg.org/)
on your PATH. It downloads each video's audio and writes a 64 kbps mono MP3 here. The app reads
these two files at runtime; no network is needed on the TV once they are bundled into the build.
