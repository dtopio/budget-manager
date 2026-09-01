"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_IDS } from "@/lib/themes";

export type Mode = "light" | "dark";

const PALETTE_KEY = "bm-palette";
const MODE_KEY = "bm-mode";
const DEFAULT_SNAPSHOT = `${DEFAULT_THEME}:light`;

// <html> is the source of truth — an inline script applies the stored theme before first
// paint, so it is already correct when React first reads it. Modelling it as an external
// store (rather than syncing into state from an effect) avoids a cascading render.
const listeners = new Set<() => void>();

function readDom() {
  const root = document.documentElement;
  const palette = root.dataset.palette;
  const mode = root.classList.contains("dark") ? "dark" : "light";
  return `${THEME_IDS.includes(palette ?? "") ? palette : DEFAULT_THEME}:${mode}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  // A string snapshot compares by value, so re-reading the DOM stays stable for
  // useSyncExternalStore while always reflecting what the init script applied.
  return typeof document === "undefined" ? DEFAULT_SNAPSHOT : readDom();
}

function getServerSnapshot() {
  return DEFAULT_SNAPSHOT;
}

let transitionTimer: number | undefined;

function write(palette: string, mode: Mode) {
  const root = document.documentElement;

  // Every theme is already in the stylesheet, so this is a pure attribute flip: the
  // browser restyles from cached custom properties instead of recomputing anything.
  root.classList.add("theme-transition");
  root.dataset.palette = palette;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;

  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => root.classList.remove("theme-transition"), 240);

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
  const [palette, mode] = value.split(":") as [string, Mode];

  // True once the client store has taken over from the server snapshot; the picker uses
  // it so it never marks the wrong theme as selected on the first paint.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const setPalette = useCallback(
    (next: string) => write(next, readDom().split(":")[1] as Mode),
    []
  );
  const setMode = useCallback((next: Mode) => write(readDom().split(":")[0], next), []);
  const toggleMode = useCallback(() => {
    const [p, m] = readDom().split(":") as [string, Mode];
    write(p, m === "dark" ? "light" : "dark");
  }, []);

  return { palette, mode, setPalette, setMode, toggleMode, ready };
}

// Runs before first paint so the stored theme is already on <html> — without it the page
// flashes the default theme until hydration.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var p = localStorage.getItem('${PALETTE_KEY}');
    var m = localStorage.getItem('${MODE_KEY}');
    var valid = ${JSON.stringify(THEME_IDS)};
    document.documentElement.dataset.palette = valid.indexOf(p) > -1 ? p : '${DEFAULT_THEME}';
    if (!m) m = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (m === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = m;
  } catch (e) {}
})();
`;
