import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { IconSpeaker } from "../../components/icons";
import { initials } from "../../components/format";
import { toast } from "../../components/Toast";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { setSetting, useSetting } from "../../state/settings";
import { RECITERS } from "../../services/quran/QuranMetadata";

/** Choose Reciter. Changing reciter keeps the current ayah and carries on playing. */
export function RecitersScreen() {
  const current = useSetting("reciter");
  useScreenFocus("reciters");
  return (
    <div className="screen reciters">
      <TopBar />
      <h1 className="screen-title reciters-title">Choose Reciter</h1>
      <div className="reciter-row" data-scroll="x">
        {RECITERS.map((r) => {
          const on = r.id === current;
          return (
            <Focusable key={r.id} id={"rc-" + r.id} group="reciters" className={"reciter-card glass-tile" + (on ? " is-current" : "")}
              isDefault={on} onSelect={() => { setSetting("reciter", r.id); toast("Reciter: " + r.name); }}>
              <div className="rc-avatar"><span>{initials(r.name)}</span></div>
              {on ? <IconSpeaker size={30} className="rc-speaker" /> : <span className="rc-speaker-gap" />}
              <div className="rc-name">{r.name}</div>
            </Focusable>
          );
        })}
      </div>
    </div>
  );
}
