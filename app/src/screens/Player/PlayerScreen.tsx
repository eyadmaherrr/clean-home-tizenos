import { Focusable } from "../../components/navigation/Focusable";
import { AyahDisplay } from "../../components/quran/AyahDisplay";
import { Progress } from "../../components/player/Progress";
import { usePlayer } from "../../components/player/usePlayer";
import { toast } from "../../components/Toast";
import {
  IconBack, IconBookmark, IconBookmarkOn, IconList, IconNext, IconNextSurah, IconPause, IconPlay,
  IconPrev, IconPrevSurah, IconRepeat, IconTranslate, IconUser,
} from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { back, navigate } from "../../app/navigation";
import { AudioManager, timeStore, playerStore } from "../../services/audio/AudioManager";
import { useStore } from "../../state/store";
import { BookmarkService, useLibrary } from "../../services/bookmarks/BookmarkService";
import { setSetting, useSetting } from "../../state/settings";
import { translation as translationMeta } from "../../services/quran/QuranMetadata";

const REPEAT_LABEL = { off: "Off", ayah: "Ayah", surah: "Surah" } as const;

/** Full-screen recitation: the ayah being recited fills the screen. */
export function PlayerScreen() {
  useScreenFocus("player");
  const p = usePlayer();
  const repeat = useSetting("repeat");
  const showTr = useSetting("showTranslation");
  const trId = useSetting("translation");
  const audioMode = useSetting("audioMode");
  const playingMode = useStore(playerStore, (s) => s.mode);
  const awaiting = useStore(playerStore, (s) => s.awaiting);
  const ayah = p.text && p.index >= 0 ? p.text.ayahs[p.index] : null;
  const total = p.meta.ayahs;
  const bookmarked = useLibrary((l) => l.bookmarks.some((b) => b.surah === p.surah && b.ayah === p.index + 1));

  const status =
    p.status === "error" ? p.error :
    p.status === "buffering" ? "Buffering…" :
    p.status === "loading" ? "Loading…" :
    p.status === "ended" ? "Recitation complete" :
    awaiting ? "Press Play for the next ayah" : "";

  return (
    <div className="screen player">
      <div className="player-top">
        <Focusable id="pl-back" group="pl-top" className="pill back-pill" onSelect={back}><IconBack size={22} /> Back</Focusable>
        <div className="player-title">
          <div className="pt-surah">Surah {p.meta.en}</div>
          <div className="pt-reciter">{p.reciterMeta.short}</div>
        </div>
        <div className="player-top-actions">
          <Focusable id="pl-bookmark" group="pl-top" className="round-btn glass-tile" label="Bookmark"
            onSelect={() => {
              if (p.index < 0) return;
              const on = BookmarkService.toggleBookmark({ surah: p.surah, ayah: p.index + 1, reciter: p.reciter, time: timeStore.get().time });
              toast(on ? "Bookmarked ayah " + (p.index + 1) : "Bookmark removed");
            }}>
            {bookmarked ? <IconBookmarkOn size={24} /> : <IconBookmark size={24} />}
          </Focusable>
          <Focusable id="pl-reciter" group="pl-top" className="round-btn glass-tile" label="Reciter" onSelect={() => navigate("reciters")}><IconUser size={24} /></Focusable>
        </div>
      </div>

      <div className="player-label">{p.index < 0 ? "Bismillah" : "Ayah " + (p.index + 1) + " of " + total}</div>
      <div className="player-ayah">
        {ayah ? <AyahDisplay arabic={ayah.ar} translation={ayah.tr} number={ayah.n} max={92} />
          : p.index < 0 && p.text ? <AyahDisplay arabic={p.text.basmala} max={92} />
          : <div className="ayah-loading">{p.error || "Loading…"}</div>}
      </div>

      <div className="player-bottom">
        <div className={"player-status" + (status ? " show" : "")}>{status}</div>
        <Progress seekable />
        <div className="transport">
          <Focusable id="pl-prev-surah" group="pl-ctl" className="ctl" label="Previous surah" onSelect={() => AudioManager.prevSurah()}><IconPrevSurah size={30} /></Focusable>
          <Focusable id="pl-prev" group="pl-ctl" className="ctl" label="Previous ayah" onSelect={() => AudioManager.prevAyah()}><IconPrev size={36} /></Focusable>
          <Focusable id="pl-play" group="pl-ctl" className="ctl ctl-main ctl-xl" isDefault label={p.playing ? "Pause" : "Play"} onSelect={() => AudioManager.toggle()}>
            {p.playing ? <IconPause size={42} /> : <IconPlay size={42} />}
          </Focusable>
          <Focusable id="pl-next" group="pl-ctl" className="ctl" label="Next ayah" onSelect={() => AudioManager.nextAyah()}><IconNext size={36} /></Focusable>
          <Focusable id="pl-next-surah" group="pl-ctl" className="ctl" label="Next surah" onSelect={() => AudioManager.nextSurah()}><IconNextSurah size={30} /></Focusable>
        </div>
        <div className="player-cards">
          <Focusable id="pl-translation" group="pl-cards" className="opt-card glass-tile" onSelect={() => setSetting("showTranslation", !showTr)}>
            <IconTranslate size={30} />
            <div><div className="oc-title">Translation</div><div className="oc-sub">{showTr ? translationMeta(trId).language + " (" + translationMeta(trId).name + ")" : "Off"}</div></div>
          </Focusable>
          <Focusable id="pl-repeat" group="pl-cards" className="opt-card glass-tile" onSelect={() => toast("Repeat: " + REPEAT_LABEL[AudioManager.cycleRepeat()])}>
            <IconRepeat size={30} />
            <div><div className="oc-title">Repeat</div><div className="oc-sub">{REPEAT_LABEL[repeat]}</div></div>
          </Focusable>
          <Focusable id="pl-mode" group="pl-cards" className="opt-card glass-tile"
            onSelect={() => {
              const next = audioMode === "surah" ? "ayah" : "surah";
              setSetting("audioMode", next);
              toast(next === "surah" ? "Full Surah" : "Ayah by Ayah");
            }}>
            <IconPlay size={28} />
            <div>
              <div className="oc-title">Playback</div>
              <div className="oc-sub">
                {playingMode === "surah" ? "Full Surah" : "Ayah by Ayah"}
                {playingMode !== audioMode ? " (only option for this reciter)" : ""}
              </div>
            </div>
          </Focusable>
          <Focusable id="pl-playlist" group="pl-cards" className="opt-card glass-tile" onSelect={() => navigate("surahs")}>
            <IconList size={30} />
            <div><div className="oc-title">Playlist</div><div className="oc-sub">Surah {p.meta.en}</div></div>
          </Focusable>
        </div>
      </div>
    </div>
  );
}
