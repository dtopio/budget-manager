import { css, hexToOklch, mix, readableOn, withC, withL } from "@/lib/color";

/* ═══════════════════════════════════════════════════════════════════════════
   THEMES — the only file you need to touch to restyle the app.

   Each theme is a handful of hex seeds. Everything else (muted text, borders,
   hover states, glass surfaces, chart hues, the spending heatmap ramp) is derived
   from them, so changing one hex below re-themes every screen consistently.

   To add a theme: copy a block, change the hexes, done. It shows up in the picker
   automatically.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Seeds = {
  /** Page background. */
  bg: string;
  /** Cards, dialogs, popovers — the surfaces that sit on top of the background. */
  surface: string;
  /** Body text. */
  fg: string;
  /** Buttons, focus rings, the "selected" colour. */
  primary: string;
  /** Secondary highlight — used for soft tints and one of the two page glows. */
  accent: string;
};

export type MoneySeeds = {
  income: string;
  expense: string;
  transfer: string;
  needs: string;
  wants: string;
  savings: string;
};

export type Theme = {
  id: string;
  label: string;
  light: Seeds;
  dark: Seeds;
  /** Money colours, tuned per mode so they stay legible on both grounds. */
  money: { light: MoneySeeds; dark: MoneySeeds };
};

export const THEMES: Theme[] = [
  {
    id: "classic",
    label: "Classic",
    light: {
      bg: "#FAF9F7",
      surface: "#FFFFFF",
      fg: "#101010",
      primary: "#4F46C8",
      accent: "#6D63E0",
    },
    dark: {
      bg: "#15161C",
      surface: "#1E2028",
      fg: "#F7F7F8",
      primary: "#8B84F0",
      accent: "#9C95F5",
    },
    // Money colours sit one step back from full saturation. A pure #0C0 green next to a
    // pure red is a traffic light, and it drags every chart it appears in down with it.
    money: {
      light: {
        income: "#1B8F55",
        expense: "#C4483F",
        transfer: "#2F6FC4",
        needs: "#2F6FC4",
        wants: "#DC7739",
        savings: "#12967A",
      },
      dark: {
        income: "#5FC98D",
        expense: "#E97C74",
        transfer: "#7FADE8",
        needs: "#7FADE8",
        wants: "#EDA070",
        savings: "#4FC9AB",
      },
    },
  },
  {
    id: "cobalt",
    label: "Cobalt",
    light: {
      bg: "#E9F1FB",
      surface: "#FFFFFF",
      fg: "#132749",
      primary: "#1E3A6E",
      accent: "#F2A469",
    },
    dark: {
      bg: "#0C1930",
      surface: "#15294A",
      fg: "#EAF1FB",
      primary: "#7FA8E8",
      accent: "#F2A469",
    },
    money: {
      light: {
        income: "#17886A",
        expense: "#E4572E",
        transfer: "#3E7BC8",
        needs: "#3E7BC8",
        wants: "#F2A469",
        savings: "#17886A",
      },
      dark: {
        income: "#4FCBA3",
        expense: "#F58060",
        transfer: "#7FA8E8",
        needs: "#7FA8E8",
        wants: "#F2A469",
        savings: "#4FCBA3",
      },
    },
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "#EBF2ED",
      surface: "#FFFFFF",
      fg: "#12322A",
      primary: "#1C4B3C",
      accent: "#9BD93A",
    },
    dark: {
      bg: "#0E211C",
      surface: "#17332B",
      fg: "#EAF4EE",
      primary: "#B9F24D",
      accent: "#7FD98F",
    },
    money: {
      light: {
        income: "#2E9E6B",
        expense: "#E4572E",
        transfer: "#7C6BD8",
        needs: "#7C6BD8",
        wants: "#E4572E",
        savings: "#2E9E6B",
      },
      dark: {
        income: "#5FD79B",
        expense: "#F58060",
        transfer: "#A78BFA",
        needs: "#A78BFA",
        wants: "#F58060",
        savings: "#5FD79B",
      },
    },
  },
  {
    // Hanami, not bubblegum: the ground is a paper white with the faintest blush, the
    // ink is a warm near-black, and the pink is spent only on the primary and the glow.
    // The money colours stay leaf-green / berry-red / dusk-blue so the palette reads as
    // a blossom against a sky rather than a wall of pink.
    id: "sakura",
    label: "Sakura",
    light: {
      bg: "#FBF4F5",
      surface: "#FFFFFF",
      fg: "#2B1E23",
      primary: "#B14C79",
      accent: "#F0A8C7",
    },
    dark: {
      bg: "#1A1215",
      surface: "#241A1E",
      fg: "#F5E8EC",
      primary: "#E28FB0",
      accent: "#EFA8C4",
    },
    money: {
      light: {
        income: "#4C9B6C",
        expense: "#C84B4B",
        transfer: "#5A76B4",
        needs: "#5A76B4",
        wants: "#C84B4B",
        savings: "#4C9B6C",
      },
      dark: {
        income: "#7ECB9B",
        expense: "#E8878A",
        transfer: "#93ACE0",
        needs: "#93ACE0",
        wants: "#E8878A",
        savings: "#7ECB9B",
      },
    },
  },
];

/* ─────────────────────────── derivation ─────────────────────────── */

function tokens(seeds: Seeds, money: MoneySeeds, isDark: boolean) {
  const bg = hexToOklch(seeds.bg);
  const surface = hexToOklch(seeds.surface);
  const fg = hexToOklch(seeds.fg);
  const primary = hexToOklch(seeds.primary);
  const accent = hexToOklch(seeds.accent);

  // How far to push a surface toward the text colour for muted fills and borders.
  const lift = (t: number) => mix(surface, fg, t);

  // Two strengths. Decorative panels (hero cards, the header) can be airy — that is what
  // makes the blur visible at all. Panels that hold text and form controls cannot: at the
  // airy value the page shows straight through and contrast collapses.
  const glassAlpha = isDark ? 0.4 : 0.44;
  // Layout cards are translucent but not blurred (see lib/glass.ts), so they carry a bit
  // more body than the header — without a blur behind it, 40% just looks washed out.
  const cardAlpha = isDark ? 0.66 : 0.7;
  // Menus and dialogs are no longer blurred (see lib/glass.ts), so the last of the
  // translucency has to go too — without a blur behind it, 10% of the page bleeding
  // through a menu just reads as dirty text.
  const panelAlpha = 1;
  const entries: Record<string, string> = {
    background: css(bg),
    foreground: css(fg),
    card: css(surface),
    "card-foreground": css(fg),
    popover: css(isDark ? withL(surface, surface.l + 0.02) : surface),
    "popover-foreground": css(fg),

    primary: css(primary),
    "primary-foreground": css(readableOn(primary)),
    secondary: css(lift(isDark ? 0.09 : 0.055)),
    "secondary-foreground": css(fg),
    muted: css(lift(isDark ? 0.08 : 0.05)),
    "muted-foreground": css(mix(fg, bg, isDark ? 0.4 : 0.42)),
    accent: css(isDark ? mix(surface, accent, 0.22) : mix(surface, accent, 0.16)),
    "accent-foreground": css(
      isDark ? withL(accent, Math.max(accent.l, 0.85)) : withL(accent, Math.min(accent.l, 0.4))
    ),
    destructive: css(hexToOklch(money.expense)),
    border: css(lift(isDark ? 0.16 : 0.1)),
    input: css(lift(isDark ? 0.2 : 0.14)),
    ring: css(primary),

    income: css(hexToOklch(money.income)),
    expense: css(hexToOklch(money.expense)),
    transfer: css(hexToOklch(money.transfer)),
    needs: css(hexToOklch(money.needs)),
    wants: css(hexToOklch(money.wants)),
    savings: css(hexToOklch(money.savings)),

    // Colour washes behind the page. They are what the frosted panels blur, so they carry
    // real saturation rather than being a barely-there tint.
    "surface-glow-1": css(accent, isDark ? 0.3 : 0.4),
    "surface-glow-2": css(primary, isDark ? 0.26 : 0.32),
    "surface-glow-3": css(mix(accent, primary, 0.5), isDark ? 0.18 : 0.22),

    // Liquid glass: a translucent surface, a bright top edge, and a hairline border.
    "glass-bg": css(surface, glassAlpha),
    "glass-card": css(surface, cardAlpha),
    // A surface lit from above is brighter at the top than the bottom. The gradient is
    // only a couple of percent — enough for the eye to read a face, not enough to see as
    // a gradient — and it is what separates a panel from a flat filled rectangle.
    "glass-tint-top": isDark ? css(withL(surface, surface.l + 0.02), 0.5) : css(withL(surface, 1), 0.5),
    "glass-tint-bottom": isDark ? css(withL(bg, bg.l - 0.01), 0.18) : css(fg, 0.022),
    "glass-panel": css(surface, panelAlpha),
    // Fields sit on top of a glass panel, so they need their own fill — a transparent
    // input on a translucent surface has no edge at all.
    "glass-field": isDark ? css(mix(surface, fg, 0.06), 0.85) : css(withL(surface, 1), 0.75),
    "glass-border": isDark ? css(withC(withL(fg, 0.95), 0.01), 0.22) : css(withL(surface, 1), 0.9),
    "glass-highlight": isDark
      ? css(withC(withL(fg, 0.98), 0.01), 0.22)
      : css(withL(surface, 1), 0.65),
    // A second, dimmer edge for the bottom of a panel — glass catches light on top and
    // shadow underneath; without it the panels read as flat translucent rectangles.
    "glass-shade": isDark ? css(withL(bg, 0.06), 0.5) : css(fg, 0.06),
  };

  return entries;
}

function block(selector: string, vars: Record<string, string>) {
  const body = Object.entries(vars)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

/**
 * Emits every theme as CSS custom properties. Rendered once into <head>, so switching
 * themes is a single attribute flip on <html> — no recalculation, no re-render.
 */
export function buildThemeCss() {
  const shared = block(":root", {
    radius: "0.85rem",
    "chart-1": "var(--needs)",
    "chart-2": "var(--wants)",
    "chart-3": "var(--savings)",
    "chart-4": "var(--transfer)",
    "chart-5": "var(--muted-foreground)",
    sidebar: "var(--card)",
    "sidebar-foreground": "var(--card-foreground)",
    "sidebar-primary": "var(--primary)",
    "sidebar-primary-foreground": "var(--primary-foreground)",
    "sidebar-accent": "var(--accent)",
    "sidebar-accent-foreground": "var(--accent-foreground)",
    "sidebar-border": "var(--border)",
    "sidebar-ring": "var(--ring)",
  });

  const themes = THEMES.flatMap((theme) => [
    block(`[data-palette="${theme.id}"]`, tokens(theme.light, theme.money.light, false)),
    block(`[data-palette="${theme.id}"].dark`, tokens(theme.dark, theme.money.dark, true)),
  ]);

  return [shared, ...themes].join("\n\n");
}

/** Swatches for the picker, straight from the seeds so they can never drift. */
export const THEME_SWATCHES = THEMES.map((t) => ({
  id: t.id,
  label: t.label,
  colors: [t.light.bg, t.light.primary, t.light.accent],
}));

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEFAULT_THEME = "classic";
