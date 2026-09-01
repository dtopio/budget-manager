// Liquid-glass surfaces. Expressed as Tailwind utilities (rather than a CSS component
// class) so tailwind-merge can resolve them against a component's own `bg-card` /
// `border` defaults when composed through cn().
//
// backdrop-filter is genuinely expensive, so these are reserved for a handful of
// floating surfaces — the header, dialogs, popovers and the hero cards. Putting them on
// list rows would blur a new layer per row and drop frames while scrolling.

// Light catches the top edge and pools in shadow underneath.
const EDGE =
  "shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_-1px_0_0_var(--glass-shade),0_16px_40px_-20px_rgb(0_0_0/0.5)]";

const BLUR = "backdrop-blur-2xl backdrop-saturate-[1.6]";

/**
 * Decorative panels — hero stat cards, envelopes. Airy enough that the page's colour
 * wash reads through them, which is what makes the blur visible at all. Only use where
 * the content is short and high-contrast.
 */
export const GLASS = `bg-[var(--glass-bg)] border border-[var(--glass-border)] ${BLUR} ${EDGE}`;

/**
 * Content panels — dialogs, popovers, menus. Nearly opaque on purpose: these hold body
 * text and form controls, and at the decorative alpha the page behind shows straight
 * through and contrast collapses.
 */
export const GLASS_PANEL = `bg-[var(--glass-panel)] border border-[var(--glass-border)] ${BLUR} ${EDGE}`;

/** The sticky header, sitting over scrolling content. */
export const GLASS_BAR =
  "bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-xl backdrop-saturate-[1.6] " +
  "shadow-[inset_0_1px_0_0_var(--glass-highlight)]";

/**
 * A light sweep across the top-left of a panel. Kept faint and short — a full-panel wash
 * at high opacity just greys the card out and washes the text with it.
 */
export const GLASS_SHEEN =
  "relative overflow-hidden " +
  "before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] " +
  "before:bg-linear-160 before:from-[var(--glass-highlight)] before:from-0% " +
  "before:via-transparent before:via-40% before:to-transparent before:opacity-40";

/** Fields sitting on a glass panel need their own fill, or they have no visible edge. */
export const GLASS_FIELD = "bg-[var(--glass-field)]";
