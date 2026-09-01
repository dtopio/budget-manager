// Liquid-glass surface classes. Expressed as Tailwind utilities (rather than a CSS
// component class) so tailwind-merge can resolve them against a component's own
// `bg-card` / `border` defaults when composed through cn().
//
// backdrop-filter is genuinely expensive, so these are reserved for a handful of
// floating surfaces — the header, dialogs, popovers and the hero stat cards. Putting
// them on list rows would blur a new layer per row and drop frames while scrolling.

const BASE =
  "bg-[var(--glass-bg)] border border-[var(--glass-border)] " +
  "shadow-[inset_0_1px_0_0_var(--glass-highlight),0_10px_30px_-18px_rgb(0_0_0/0.45)]";

/** Standard frosted panel: cards, dialogs, popovers. */
export const GLASS = `${BASE} backdrop-blur-xl backdrop-saturate-150`;

/** Lighter blur for the sticky header, which sits over scrolling content. */
export const GLASS_BAR =
  "bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-lg backdrop-saturate-150";

/** Adds the wet highlight sweep across the top of a panel. */
export const GLASS_SHEEN =
  "relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-px " +
  "before:h-px before:bg-linear-to-r before:from-transparent before:via-[var(--glass-highlight)] before:to-transparent";
