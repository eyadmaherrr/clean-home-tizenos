import type { CSSProperties, ReactNode } from "react";

/**
 * Frosted-glass surface. With glass "full" (html.glass-full) it blurs what's behind it; in
 * "lite" mode (weaker TVs, or no backdrop-filter support) it falls back to a darker
 * translucent fill with no blur. Use for large panels only; small tiles use `.glass-tile`.
 */
export function Glass({ className, style, children, strong }: { className?: string; style?: CSSProperties; children?: ReactNode; strong?: boolean }) {
  return (
    <div className={"glass" + (strong ? " glass-strong" : "") + (className ? " " + className : "")} style={style}>
      {children}
    </div>
  );
}
