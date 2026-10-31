import { Glass } from "../glass/Glass";
import { Focusable } from "../navigation/Focusable";
import { Progress } from "./Progress";
import { usePlayer } from "./usePlayer";
import { AudioManager } from "../../services/audio/AudioManager";
import { WallpaperService } from "../../services/wallpapers/WallpaperService";
import { IconNext, IconPause, IconPlay, IconPrev } from "../icons";

/** The "Now Reciting" card on Home: artwork, surah, reciter, transport and progress. */
export function MiniPlayer() {
  const p = usePlayer();
  const label = p.status === "buffering" || p.status === "loading" ? "Loading…" : p.playing ? "Now Reciting" : "Continue Listening";
  // Athkar play through the same player; Previous / Next then skip 15 s.
  const a = p.athkar;
  return (
    <Glass strong className="mini">
      <img className="mini-art" src={WallpaperService.art(p.surah)} alt="" />
      <div className="mini-body">
        <div className="mini-top">
          <div className="mini-meta">
            <div className="mini-label">{label}</div>
            {a ? <div className="mini-title" lang="ar">{a.title}</div> : <div className="mini-title">Surah {p.meta.en}</div>}
            <div className="mini-sub">{a ? a.reciter : p.reciterMeta.short}</div>
          </div>
          <div className="mini-controls">
            <Focusable id="mini-prev" group="mini" className="ctl" label={a ? "Back 15 seconds" : "Previous ayah"} onSelect={() => AudioManager.prevAyah()}><IconPrev size={30} /></Focusable>
            <Focusable id="mini-play" group="mini" className="ctl ctl-main" label={p.playing ? "Pause" : "Play"} onSelect={() => AudioManager.toggle()}>
              {p.playing ? <IconPause size={34} /> : <IconPlay size={34} />}
            </Focusable>
            <Focusable id="mini-next" group="mini" className="ctl" label={a ? "Forward 15 seconds" : "Next ayah"} onSelect={() => AudioManager.nextAyah()}><IconNext size={30} /></Focusable>
          </div>
        </div>
        <Progress compact />
      </div>
    </Glass>
  );
}
