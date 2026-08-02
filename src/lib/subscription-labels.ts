// Quick-pick labels for transactions under the "Subscriptions" category.
// Stored as a "Name" prefix in the transaction note (e.g. "Spotify" or "Spotify · annual plan").
export const SUBSCRIPTION_LABELS: { name: string; icon: string }[] = [
  { name: "Claude", icon: "Sparkles" },
  { name: "Spotify", icon: "Music" },
  { name: "YouTube", icon: "SquarePlay" },
  { name: "Netflix", icon: "Tv" },
  { name: "Internet", icon: "Wifi" },
  { name: "Phone", icon: "Smartphone" },
  { name: "iCloud", icon: "Cloud" },
  { name: "Amazon Prime", icon: "ShoppingBag" },
  { name: "Gym", icon: "Dumbbell" },
  { name: "Gaming", icon: "Gamepad2" },
  { name: "News", icon: "Newspaper" },
];

export function isSubscriptionCategory(name: string | undefined | null): boolean {
  return (name ?? "").toLowerCase().includes("subscription");
}

// A transaction note for a subscription is stored as "Label" or "Label · extra detail".
export function parseSubscriptionLabel(note: string | null): {
  label: string | null;
  detail: string | null;
} {
  if (!note) return { label: null, detail: null };
  const [label, ...rest] = note.split(" · ");
  return { label, detail: rest.length ? rest.join(" · ") : null };
}
