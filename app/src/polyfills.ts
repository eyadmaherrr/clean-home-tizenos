// Small polyfills for Chromium 69 (Tizen 5.5, 2020 TVs). The build lowers syntax
// (optional chaining, ??, etc.); these cover the few runtime APIs the app relies on that
// arrived after Chromium 69.

/* eslint-disable @typescript-eslint/no-explicit-any */
const g: any = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : window;
if (typeof (g as any).globalThis === "undefined") (g as any).globalThis = g;

if (!(Object as any).fromEntries) {
  (Object as any).fromEntries = (entries: Iterable<[PropertyKey, unknown]>) => {
    const o: Record<PropertyKey, unknown> = {};
    for (const [k, v] of entries as any) o[k] = v;
    return o;
  };
}

if (!(Promise as any).allSettled) {
  (Promise as any).allSettled = (ps: Promise<unknown>[]) =>
    Promise.all(ps.map((p) => Promise.resolve(p).then(
      (value) => ({ status: "fulfilled", value }),
      (reason) => ({ status: "rejected", reason }))));
}

if (!(String.prototype as any).replaceAll) {
  (String.prototype as any).replaceAll = function (this: string, a: string, b: string) {
    return this.split(a).join(b);
  };
}

if (!(Array.prototype as any).at) {
  (Array.prototype as any).at = function (this: unknown[], i: number) {
    i = Math.trunc(i) || 0;
    if (i < 0) i += this.length;
    return this[i];
  };
}

export {};
