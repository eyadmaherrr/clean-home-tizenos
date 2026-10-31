import type { ComponentType } from "react";
import { TopBar } from "../../components/navigation/TopBar";
import { Focusable } from "../../components/navigation/Focusable";
import { AyahDisplay } from "../../components/quran/AyahDisplay";
import { MiniPlayer } from "../../components/player/MiniPlayer";
import { usePlayer } from "../../components/player/usePlayer";
import { IconBook, IconMosque, IconQuran, IconTasbih } from "../../components/icons";
import { useScreenFocus } from "../../platform/remote/useScreenFocus";
import { navigate, type ScreenName } from "../../app/navigation";
import { AudioManager } from "../../services/audio/AudioManager";

const TILES: { id: string; title: string; sub: string; Icon: ComponentType<{ size?: number }>; go: ScreenName }[] = [
  { id: "quran", title: "Now Playing", sub: "Full-Screen Player", Icon: IconQuran, go: "player" },
  { id: "surahs", title: "Surahs", sub: "All 114 Surahs", Icon: IconBook, go: "surahs" },
  { id: "athkar", title: "Athkar", sub: "Morning · Evening · Hisn", Icon: IconTasbih, go: "athkar" },
  { id: "prayer", title: "Prayer Times", sub: "Today's Prayers", Icon: IconMosque, go: "prayer" },
];

/** Home / Now Reciting: the current ayah is the centre of the screen. */
export function HomeScreen() {
  useScreenFocus("home");
  const p = usePlayer();
  const ayah = p.text && p.index >= 0 ? p.text.ayahs[p.index] : null;
  const prelude = p.index < 0 && p.text;
  const eyebrow = "Surah " + p.meta.en + (prelude ? " · Bismillah" : " · Ayah " + (p.index + 1));

  return (
    <div className="screen home">
      <TopBar />
      <section className="home-ayah">
        <div className="eyebrow"><span className="rule" />{eyebrow}<span className="rule" /></div>
        {ayah ? <AyahDisplay arabic={ayah.ar} translation={ayah.tr} number={ayah.n} max={66} className="home-ayah-box" />
          : prelude ? <AyahDisplay arabic={p.text!.basmala} max={66} className="home-ayah-box" />
          : <div className="home-ayah-box ayah-loading">{p.error || "Loading…"}</div>}
        <div className="ornament">◆</div>
      </section>
      <MiniPlayer />
      <div className="tiles tiles-4">
        {TILES.map(({ id, title, sub, Icon, go }) => (
          <Focusable key={id} id={"tile-" + id} group="tiles" className="tile glass-tile" isDefault={id === "quran"}
            onSelect={() => {
              if (go === "player" && (p.athkar || p.status !== "playing")) AudioManager.resumeQuran();
              navigate(go);
            }}>
            <Icon size={44} />
            <div className="tile-title">{title}</div>
            <div className="tile-sub">{sub}</div>
          </Focusable>
        ))}
      </div>
    </div>
  );
}
