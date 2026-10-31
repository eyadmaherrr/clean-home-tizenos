import { LibraryLayout } from "../LibraryLayout";
import { Focusable } from "../../components/navigation/Focusable";
import { Glass } from "../../components/glass/Glass";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { setSetting, useSetting, type Settings } from "../../state/settings";
import { RECITERS, TRANSLATIONS } from "../../services/quran/QuranMetadata";
import { TizenAVPlayEngine } from "../../services/audio/TizenAVPlayEngine";

type Option<V> = { value: V; label: string };

/** A row whose value steps forward with OK. Left / Right stay free for moving focus, so
 *  leaving the panel never changes a setting by accident. */
function ChoiceRow<K extends keyof Settings>({ k, label, options }: { k: K; label: string; options: Option<Settings[K]>[] }) {
  const value = useSetting(k);
  const i = Math.max(0, options.findIndex((o) => o.value === value));
  const step = (d: number) => setSetting(k, options[(i + d + options.length) % options.length].value);
  return (
    <Focusable id={"set-" + String(k)} group="settings" className="set-row"
      onSelect={() => step(1)}>
      <span className="set-label">{label}</span>
      <span className="set-value">{options[i].label}<span className="chev">›</span></span>
    </Focusable>
  );
}

function ToggleRow({ k, label }: { k: "showTranslation" | "continuous" | "resumeLast" | "basmala" | "pauseEachAyah"; label: string }) {
  const on = useSetting(k);
  return (
    <Focusable id={"set-" + k} group="settings" className="set-row" onSelect={() => setSetting(k, !on)}>
      <span className="set-label">{label}</span>
      <span className={"switch" + (on ? " on" : "")}><span className="knob" /></span>
    </Focusable>
  );
}

export function SettingsScreen() {
  useScreenFocus("settings");
  const engines: Option<Settings["engine"]>[] = [{ value: "html5", label: "HTML5 Audio" }];
  if (TizenAVPlayEngine.available()) engines.push({ value: "avplay", label: "Samsung AVPlay" });

  return (
    <LibraryLayout active="settings" title="Settings">
      <Glass strong className="settings-panel">
        <div className="settings-scroll" data-scroll="y">
          <div className="set-section">Audio</div>
          <ChoiceRow k="reciter" label="Default Reciter" options={RECITERS.map((r) => ({ value: r.id, label: r.short }))} />
          <ChoiceRow k="audioMode" label="Playback" options={[{ value: "surah", label: "Full Surah" }, { value: "ayah", label: "Ayah by Ayah" }]} />
          <ToggleRow k="pauseEachAyah" label="Pause After Each Ayah" />
          <ChoiceRow k="repeat" label="Repeat" options={[{ value: "off", label: "Off" }, { value: "ayah", label: "Ayah" }, { value: "surah", label: "Surah" }]} />
          <ToggleRow k="continuous" label="Continue to the Next Surah" />
          <ToggleRow k="resumeLast" label="Continue from Last Position" />
          <ToggleRow k="basmala" label="Recite Basmala Before Each Surah (Ayah by Ayah)" />
          <ChoiceRow k="engine" label="Audio Engine" options={engines} />

          <div className="set-section">Display</div>
          <ChoiceRow k="arabicSize" label="Arabic Text Size" options={[{ value: "medium", label: "Medium" }, { value: "large", label: "Large" }, { value: "xlarge", label: "Extra Large" }]} />
          <ToggleRow k="showTranslation" label="Show Translation" />
          <ChoiceRow k="translation" label="Translation" options={TRANSLATIONS.map((t) => ({ value: t.id, label: t.language + " (" + t.name + ")" }))} />
          <ChoiceRow k="theme" label="Theme" options={[
            { value: "auto", label: "Auto (Time of Day)" }, { value: "morning", label: "Morning" }, { value: "day", label: "Day" },
            { value: "evening", label: "Evening" }, { value: "night", label: "Night" }]} />
          <ChoiceRow k="glass" label="Glass Effects" options={[{ value: "auto", label: "Auto" }, { value: "full", label: "Full" }, { value: "lite", label: "Reduced (faster)" }]} />
        </div>
      </Glass>
    </LibraryLayout>
  );
}
