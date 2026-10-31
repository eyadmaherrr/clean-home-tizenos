import { useStore } from "../../state/store";
import { timeStore, AudioManager } from "../../services/audio/AudioManager";
import { clock } from "../format";
import { Focusable } from "../navigation/Focusable";

/**
 * Position within the current ayah. Subscribes to the fast time store on its own, so the rest
 * of the screen doesn't re-render several times a second. When `seekable`, Left/Right on the
 * focused bar seek 5 s.
 */
export function Progress({ seekable, compact }: { seekable?: boolean; compact?: boolean }) {
  const time = useStore(timeStore, (s) => s.time);
  const duration = useStore(timeStore, (s) => s.duration);
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const bar = (
    <div className="bar">
      <div className="bar-fill" style={{ width: pct + "%" }} />
      <div className="bar-knob" style={{ left: pct + "%" }} />
    </div>
  );
  return (
    <div className={"progress" + (compact ? " compact" : "")}>
      {seekable ? (
        <Focusable id="seek" group="player-seek" className="bar-wrap" label="Seek"
          onKey={(a) => {
            if (a === "left") { AudioManager.seekBy(-5); return true; }
            if (a === "right") { AudioManager.seekBy(5); return true; }
            return false;
          }}>
          {bar}
        </Focusable>
      ) : <div className="bar-wrap">{bar}</div>}
      <div className="times"><span>{clock(time)}</span><span>{clock(duration)}</span></div>
    </div>
  );
}
