// Liquid-glass surfaces. Expressed as Tailwind utilities (rather than a CSS component
// class) so tailwind-merge can resolve them against a component's own `bg-card` /
// `border` defaults when composed through cn().
//
// backdrop-filter is genuinely expensive, so these are reserved for a handful of
// floating surfaces — the header, dialogs, popovers and the hero cards. Putting them on
// list rows would blur a new layer per row and drop frames while scrolling.

// Light catches the top edge and pools in shadow underneath. The cast shadow comes from
// the shared elevation scale in globals.css so glass and solid cards sit in the same
// lighting rather than each inventing their own.
const EDGE =
  "shadow-[inset_0_1px_0_0_var(--glass-highlight),inset_0_-1px_0_0_var(--glass-shade),var(--elev-2)]";

// backdrop-filter is now used in exactly one place: the sticky header, which is the only
// surface with content genuinely scrolling behind it.
//
// This is deliberate, not just a perf choice. A blurred element becomes its own
// composited layer, and on some GPU/driver combinations those layers show their bounds
// as a hard-edged rectangle on repaint. That artifact appeared with the glass work and
// was reported repeatedly — first on the stat cards, then on the month picker whenever a
// month was hovered. Neither was blurring anything that moved, so neither asks for a
// layer any more.

/**
 * Decorative panels — hero stat cards, envelopes. Airy enough that the page's colour
 * wash reads through them, which is what makes the blur visible at all. Only use where
 * the content is short and high-contrast.
 */
export const GLASS =
  "bg-[var(--glass-card)] bg-[linear-gradient(180deg,var(--glass-tint-top),var(--glass-tint-bottom))] " +
  `border border-[var(--glass-border)] ${EDGE}`;

/**
 * Content panels — dialogs, popovers, menus. Opaque on purpose: these hold body text and
 * form controls, and at a decorative alpha the page behind shows straight through and
 * contrast collapses.
 *
 * Deliberately NOT blurred, for the same reason the stat cards aren't. A backdrop-filter
 * makes the panel its own composited layer, and every repaint inside it — hovering a
 * month in the picker, moving through a menu — makes Chromium re-sample the backdrop and
 * flash the layer's bounds as a hard-edged rectangle over the page behind. The panel is
 * opaque, so there was never anything to see through it anyway.
 */
export const GLASS_PANEL = `bg-[var(--glass-panel)] border border-[var(--glass-border)] ${EDGE}`;

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
