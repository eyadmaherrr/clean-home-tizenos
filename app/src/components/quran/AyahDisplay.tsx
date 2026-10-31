import { useLayoutEffect, useRef, useState } from "react";
import { useSetting } from "../../state/settings";

/** Ornamental ayah-number medallion (eight-pointed star ring). */
export function Medallion({ n, size = 64 }: { n: number; size?: number }) {
  return (
    <span className="medallion" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="14" y="14" width="36" height="36" rx="4" />
          <rect x="14" y="14" width="36" height="36" rx="4" transform="rotate(45 32 32)" />
          <circle cx="32" cy="32" r="15" />
        </g>
      </svg>
      <span className="medallion-n" style={{ fontSize: size * (n > 99 ? 0.26 : 0.32) }}>{n}</span>
    </span>
  );
}

const BASE: Record<string, number> = { medium: 0.85, large: 1, xlarge: 1.18 };

interface Props {
  arabic: string;
  translation?: string;
  number?: number;
  /** Largest Arabic font size in px for this placement (scaled by the text-size setting). */
  max: number;
  min?: number;
  className?: string;
}

/**
 * The ayah as the centre of the screen: Arabic (Amiri Quran) with its medallion and the
 * translation beneath. The Arabic shrinks until the block fits its box, so the longest ayahs
 * still show in full.
 */
export function AyahDisplay({ arabic, translation, number, max, min = 30, className }: Props) {
  const scale = BASE[useSetting("arabicSize")] || 1;
  const showTr = useSetting("showTranslation");
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(max * scale);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let s = max * scale;
    el.style.setProperty("--ar-size", s + "px");
    // Shrink in steps until nothing overflows (bounded; cheap for a single block).
    for (let i = 0; i < 24 && s > min && el.scrollHeight > el.clientHeight + 2; i++) {
      s = Math.max(min, s * 0.92);
      el.style.setProperty("--ar-size", s + "px");
    }
    setSize(s);
  }, [arabic, translation, max, min, scale, showTr]);

  return (
    <div ref={box} className={"ayah " + (className || "")} style={{ ["--ar-size" as string]: size + "px" }}>
      <div className="ayah-ar" dir="rtl" lang="ar">
        {arabic}
        {number ? <> <Medallion n={number} size={Math.max(40, size * 0.95)} /></> : null}
      </div>
      {showTr && translation ? <div className="ayah-tr">{translation}</div> : null}
    </div>
  );
}
