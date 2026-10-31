import { useEffect } from "react";
import { Focusable } from "../../components/navigation/Focusable";
import { Progress } from "../../components/player/Progress";
import { usePlayer } from "../../components/player/usePlayer";
import { IconBack, IconNext, IconPause, IconPlay, IconPrev } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { back } from "../../app/navigation";
import { AudioManager, playerStore } from "../../services/audio/AudioManager";
import { RECORDINGS, useAthkar } from "../../services/athkar/AthkarService";

const RECITER = "Mishary Alafasy";

/** Morning or evening athkar: the text, and the recording in the app's one audio player. */
export function AthkarListenScreen() {
  useScreenFocus("athkar-listen");
  const time = useAthkar((s) => s.time);
  const rec = RECORDINGS[time];
  const p = usePlayer();
  const loaded = !!p.athkar && p.athkar.kind === time;

  // Start this recording unless it is already the one in the player.
  useEffect(() => {
    const a = playerStore.get().athkar;
    if (!a || a.kind !== time) AudioManager.playAthkar({ kind: time, title: rec.title, reciter: RECITER, url: rec.audio });
  }, [time]);

  const status = !loaded ? "" :
    p.status === "error" ? p.error :
    p.status === "buffering" || p.status === "loading" ? "Loading…" :
    p.status === "ended" ? "Complete" : "";

  return (
    <div className="screen athkar-listen">
      <div className="player-top">
        <Focusable id="al-back" group="al-top" className="pill back-pill" onSelect={back}><IconBack size={22} /> Back</Focusable>
        <div className="player-title">
          <div className="pt-surah" lang="ar">{rec.title}</div>
          <div className="pt-reciter">{RECITER}</div>
        </div>
        <div className="player-top-actions" />
      </div>

      <div className="athkar-scroll" data-scroll="y">
        {rec.items.map((t, i) => (
          <Focusable key={i} id={"al-" + i} group="al-text" className="athkar-block">
            <span dir="rtl" lang="ar">{t}</span>
          </Focusable>
        ))}
      </div>

      <div className="athkar-player glass-tile">
        <div className={"player-status" + (status ? " show" : "")}>{status}</div>
        <Progress seekable />
        <div className="transport">
          <Focusable id="al-rew" group="al-ctl" className="ctl" label="Back 15 seconds" onSelect={() => AudioManager.prevAyah()}><IconPrev size={34} /></Focusable>
          <Focusable id="al-play" group="al-ctl" className="ctl ctl-main ctl-xl" isDefault label={loaded && p.playing ? "Pause" : "Play"}
            onSelect={() => {
              if (loaded) AudioManager.toggle();
              else AudioManager.playAthkar({ kind: time, title: rec.title, reciter: RECITER, url: rec.audio });
            }}>
            {loaded && p.playing ? <IconPause size={42} /> : <IconPlay size={42} />}
          </Focusable>
          <Focusable id="al-fwd" group="al-ctl" className="ctl" label="Forward 15 seconds" onSelect={() => AudioManager.nextAyah()}><IconNext size={34} /></Focusable>
        </div>
      </div>
    </div>
  );
}
