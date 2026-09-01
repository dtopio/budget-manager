// Liquid-glass surface classes. Expressed as Tailwind utilities (rather than a CSS
// component class) so tailwind-merge can resolve them against a component's own
// `bg-card` / `border` defaults when composed through cn().
//
// backdrop-filter is genuinely expensive, so these are reserved for a handful of
// floating surfaces — the header, dialogs, popovers and the hero cards. Putting them on
// list rows would blur a new layer per row and drop frames while scrolling.

// Light catches the top edge and pools in shadow underneath; the ring keeps the panel
// legible where it overlaps a busy part of the background wash.
const EDGE =
  "shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_-1px_0_0_var(--glass-shade),0_16px_40px_-20px_rgb(0_0_0/0.5)]";

/** Standard frosted panel: cards, dialogs, popovers. */
export const GLASS = `bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-2xl backdrop-saturate-[1.8] ${EDGE}`;

/** The sticky header, sitting over scrolling content. */
export const GLASS_BAR =
  "bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-xl backdrop-saturate-[1.8] " +
  "shadow-[inset_0_1px_0_0_var(--glass-highlight)]";

/** Adds a diagonal light sweep across the panel — the "wet" part of liquid glass. */
export const GLASS_SHEEN =
  "relative overflow-hidden " +
  "before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] " +
  "before:bg-linear-160 before:from-[var(--glass-highlight)] before:via-transparent before:to-transparent " +
  "before:opacity-70";
