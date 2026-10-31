import { useStore } from "../../state/store";
import { playerStore } from "../../services/audio/AudioManager";
import { surah as surahMeta, reciter as reciterMeta } from "../../services/quran/QuranMetadata";

/** What's loaded in the player, for display. Each field is its own subscription. */
export function usePlayer() {
  const status = useStore(playerStore, (s) => s.status);
  const surah = useStore(playerStore, (s) => s.surah);
  const index = useStore(playerStore, (s) => s.index);
  const reciter = useStore(playerStore, (s) => s.reciter);
  const text = useStore(playerStore, (s) => s.text);
  const error = useStore(playerStore, (s) => s.error);
  const athkar = useStore(playerStore, (s) => s.athkar);
  const playing = status === "playing" || status === "buffering" || status === "loading";
  return { status, surah, index, reciter, text, error, athkar, playing, meta: surahMeta(surah), reciterMeta: reciterMeta(reciter) };
}
