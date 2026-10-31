/** "4:27" style time. */
export function clock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ":" + (r < 10 ? "0" : "") + r;
}

/** Two-letter monogram for a reciter's card. */
export function initials(name: string): string {
  const parts = name.replace(/\b(Al|As|Ar|Ash|Abu|Abdul|Abdur)\b-?/gi, " ").split(/[\s-]+/).filter(Boolean);
  const pick = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return pick.toUpperCase();
}
