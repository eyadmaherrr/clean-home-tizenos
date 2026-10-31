/* eslint-disable @typescript-eslint/no-explicit-any */
/** Platform detection and access to Tizen globals, which only exist on the TV. */

export const tizen: any = (window as any).tizen;
export const webapis: any = (window as any).webapis;

export const isTizen = !!(tizen && tizen.application);

export function hasAVPlay(): boolean {
  return !!(webapis && webapis.avplay);
}

/** Chromium major version (Tizen 5.5 = 69, 6.0 = 76, 6.5 = 85, 7.0 = 94, 8.0 = 108). */
export const chromium = (() => {
  const m = /Chrome\/(\d+)/.exec(navigator.userAgent) || /\) (\d+)\.\d+\.\d+\.\d+\/[\d.]+ TV/.exec(navigator.userAgent);
  return m ? parseInt(m[1], 10) : 0;
})();

export function supportsBackdrop(): boolean {
  try {
    return !!(window.CSS && CSS.supports && (CSS.supports("backdrop-filter", "blur(2px)") || CSS.supports("-webkit-backdrop-filter", "blur(2px)")));
  } catch {
    return false;
  }
}
