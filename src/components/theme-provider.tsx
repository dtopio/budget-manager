"use client";

import { useCallback, useSyncExternalStore } from "react";

export const PALETTES = [
  { id: "sand", label: "Sand", swatch: ["oklch(0.941 0.026 92)", "oklch(0.72 0.06 155)"] },
  { id: "mist", label: "Mist", swatch: ["oklch(0.878 0.021 245)", "oklch(0.56 0.09 268)"] },
  { id: "forest", label: "Forest", swatch: ["oklch(0.9 0.03 152)", "oklch(0.5 0.11 155)"] },
] as const;

export type Palette = (typeof PALETTES)[number]["id"];
export type Mode = "light" | "dark";

const PALETTE_KEY = "bm-palette";
const MODE_KEY = "bm-mode";
const PALETTE_IDS = PALETTES.map((p) => p.id) as readonly string[];
const DEFAULT_SNAPSHOT = "sand:light";

// <html> is the source of truth — an inline script sets it from localStorage before
// first paint, so it is already correct by the time React reads it. Modelling it as an
// external store (rather than syncing into state from an effect) means no cascading
// render and no hydration mismatch: the server snapshot is the documented default.
const listeners = new Set<() => void>();

function readDom() {
  const root = document.documentElement;
  const palette = root.dataset.palette;
  const mode = root.classList.contains("dark") ? "dark" : "light";
  return `${PALETTE_IDS.includes(palette ?? "") ? palette : "sand"}:${mode}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  // A string snapshot is compared by value, so re-reading the DOM each time is stable
  // enough for useSyncExternalStore and always reflects what the init script applied.
  return typeof document === "undefined" ? DEFAULT_SNAPSHOT : readDom();
}

function getServerSnapshot() {
  return DEFAULT_SNAPSHOT;
}

function write(palette: Palette, mode: Mode) {
  const root = document.documentElement;

  // Transition only around a deliberate change, so first paint doesn't animate.
  root.classList.add("theme-transition");
  root.dataset.palette = palette;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  window.setTimeout(() => root.classList.remove("theme-transition"), 260);

  try {
    localStorage.setItem(PALETTE_KEY, palette);
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Private mode / storage disabled: the theme still applies for this session.
  }

  for (const listener of listeners) listener();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [palette, mode] = value.split(":") as [Palette, Mode];

  // True once the client store has taken over from the server snapshot; the toggle uses
  // it to avoid showing a checkmark against the wrong palette on the first paint.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const setPalette = useCallback((next: Palette) => write(next, readDom().split(":")[1] as Mode), []);
  const setMode = useCallback((next: Mode) => write(readDom().split(":")[0] as Palette, next), []);
  const toggleMode = useCallback(() => {
    const [p, m] = readDom().split(":") as [Palette, Mode];
    write(p, m === "dark" ? "light" : "dark");
  }, []);

  return { palette, mode, setPalette, setMode, toggleMode, ready };
}

// Runs before first paint so the stored theme is already on <html> — without it the page
// flashes the default palette until hydration.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var p = localStorage.getItem('${PALETTE_KEY}');
    var m = localStorage.getItem('${MODE_KEY}');
    var valid = ${JSON.stringify(PALETTE_IDS)};
    document.documentElement.dataset.palette = valid.indexOf(p) > -1 ? p : 'sand';
    if (!m) m = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (m === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = m;
  } catch (e) {}
})();
`;
