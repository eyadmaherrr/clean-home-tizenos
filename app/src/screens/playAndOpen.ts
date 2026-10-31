import { AudioManager } from "../services/audio/AudioManager";
import { navigate } from "../app/navigation";
import { setSetting, settingsStore } from "../state/settings";

/** Start a surah (from an ayah, optionally with a reciter and position) and open the player. */
export function playAndOpen(surah: number, ayah = 1, opts: { reciter?: string; startAt?: number } = {}): void {
  if (opts.reciter && opts.reciter !== settingsStore.get().reciter) setSetting("reciter", opts.reciter);
  AudioManager.play(surah, ayah, { startAt: opts.startAt });
  navigate("player");
}
