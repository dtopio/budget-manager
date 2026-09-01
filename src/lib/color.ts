// Minimal OKLCH toolkit. Themes are authored as plain hex (see themes.ts); everything
// else — muted text, borders, hover tints, glass surfaces — is derived from those seeds
// in OKLCH, where "10% lighter" actually looks 10% lighter regardless of hue. Only the
// forward conversion is needed because CSS can consume oklch() directly.

export type Oklch = { l: number; c: number; h: number };

function srgbToLinear(v: number) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function hexToOklch(hex: string): Oklch {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  const r = srgbToLinear(parseInt(full.slice(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(full.slice(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(full.slice(4, 6), 16) / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(a * a + bb * bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

const round = (n: number, places = 4) => Number(n.toFixed(places));

export function css({ l, c, h }: Oklch, alpha = 1) {
  const base = `${round(Math.min(Math.max(l, 0), 1), 4)} ${round(Math.max(c, 0), 4)} ${round(h, 2)}`;
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${round(alpha, 3)})`;
}

/** Interpolate two colours in OKLCH, taking the shorter way around the hue circle. */
export function mix(a: Oklch, b: Oklch, t: number): Oklch {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  // A greyscale endpoint has no meaningful hue — keep the other one's.
  const h = a.c < 0.005 ? b.h : b.c < 0.005 ? a.h : a.h + dh * t;
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: (h + 360) % 360,
  };
}

export const withL = (color: Oklch, l: number): Oklch => ({ ...color, l });
export const withC = (color: Oklch, c: number): Oklch => ({ ...color, c });

/** Near-white or near-black text for a given surface, whichever will actually read. */
export function readableOn(color: Oklch): Oklch {
  return color.l > 0.62 ? { l: 0.17, c: Math.min(color.c, 0.03), h: color.h } : { l: 0.98, c: 0.01, h: color.h };
}
