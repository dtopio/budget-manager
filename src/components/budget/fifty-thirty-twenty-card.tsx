"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { GLASS } from "@/lib/glass";
import {
  SUBSCRIPTION_LABELS,
  isSubscriptionCategory,
  parseSubscriptionLabel,
} from "@/lib/subscription-labels";
import type { BudgetGroup, Summary } from "@/lib/types";

// Colours come from the active palette's tokens so the envelopes restyle with the theme.
const GROUP_META: Record<
  BudgetGroup,
  { label: string; color: string; description: string }
> = {
  NEEDS: { label: "Needs", color: "var(--needs)", description: "Rent, groceries, utilities…" },
  WANTS: { label: "Wants", color: "var(--wants)", description: "Dining out, subscriptions…" },
  SAVINGS: { label: "Savings", color: "var(--savings)", description: "Set aside for the future" },
};

const FALLBACK_TINT = "var(--muted-foreground)";

// Tokens are colour functions, not hex, so alpha has to come from color-mix rather
// than an appended "1a"/"1f" suffix.
function tint(color: string, pct: number) {
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`;
}

function Envelope({
  group,
  allocated,
  spentActual,
  spentUpcoming,
  remaining,
  targetPct,
}: {
  group: BudgetGroup;
  allocated: number;
  spentActual: number;
  spentUpcoming: number;
  remaining: number;
  targetPct: number;
}) {
  const meta = GROUP_META[group];
  const actualPct = allocated > 0 ? (spentActual / allocated) * 100 : 0;
  const upcomingPct = allocated > 0 ? (spentUpcoming / allocated) * 100 : 0;
  const overBudget = remaining < 0;

  return (
    <div className={cn("space-y-2 rounded-xl p-4", GLASS)}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: tint(meta.color, 14) }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
        </span>
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="text-xs text-muted-foreground">{targetPct}% of income</span>
      </div>

      <div>
        <div
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            overBudget && "text-expense"
          )}
        >
          {overBudget
            ? `-${formatCurrency(Math.abs(remaining))}`
            : formatCurrency(remaining)}
        </div>
        <p className="text-xs text-muted-foreground">
          {overBudget ? "over budget" : "left to spend"}
        </p>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${Math.min(actualPct, 100)}%`,
            backgroundColor: overBudget ? "var(--expense)" : meta.color,
          }}
        />
        <div
          className="absolute top-0 h-full rounded-full opacity-40"
          style={{
            left: `${Math.min(actualPct, 100)}%`,
            width: `${Math.min(upcomingPct, 100 - Math.min(actualPct, 100))}%`,
            backgroundColor: overBudget ? "var(--expense)" : meta.color,
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {formatCurrency(spentActual)} spent
        {spentUpcoming > 0 && ` + ${formatCurrency(spentUpcoming)} upcoming`} of{" "}
        {formatCurrency(allocated)}
      </p>
    </div>
  );
}

function subscriptionIcon(label: string | null) {
  return SUBSCRIPTION_LABELS.find((s) => s.name === label)?.icon;
}

function categoryGlyph(icon: string, color: string) {
  const Icon = getIcon(icon);
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: tint(color, 12) }}
    >
      <Icon className="h-3 w-3" style={{ color }} />
    </span>
  );
}

type UpcomingItem = Summary["upcomingItems"][number];

function upcomingDisplayName(item: UpcomingItem) {
  const isSub = isSubscriptionCategory(item.categoryName);
  const { label, detail } = parseSubscriptionLabel(item.note);
  const subIcon = isSub ? subscriptionIcon(label) : undefined;
  return {
    name: isSub && label ? label : item.categoryName ?? "Uncategorized",
    detail: isSub ? detail : null,
    icon: subIcon ?? item.categoryIcon ?? "Wallet",
    color: item.categoryColor ?? FALLBACK_TINT,
  };
}

function groupUpcoming(items: UpcomingItem[]) {
  const groups: { key: string; items: UpcomingItem[] }[] = [];
  const byKey = new Map<string, { key: string; items: UpcomingItem[] }>();
  for (const item of items) {
    const { name } = upcomingDisplayName(item);
    let group = byKey.get(name);
    if (!group) {
      group = { key: name, items: [] };
      byKey.set(name, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function UpcomingList({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        Scheduled this month (already counted above)
      </p>
      <ul className="divide-y divide-border/60">
        {groupUpcoming(items).map((group) => {
          const first = group.items[0];
          const { name, detail, icon, color } = upcomingDisplayName(first);
          const total = group.items.reduce((sum, item) => sum + item.amount, 0);

          if (group.items.length === 1) {
            return (
              <li key={group.key} className="flex items-center gap-2.5 py-1.5 text-sm">
                {categoryGlyph(icon, color)}
                <span className="min-w-0 flex-1 truncate">
                  {name}
                  {detail && <span className="text-muted-foreground"> · {detail}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(first.date), "MMM d")}
                </span>
                <span className="w-14 shrink-0 text-right tabular-nums font-medium">
                  {formatCurrency(first.amount)}
                </span>
                <span className="h-3.5 w-3.5 shrink-0" />
              </li>
            );
          }

          const sorted = [...group.items].sort((a, b) => a.date.localeCompare(b.date));
          return (
            <UpcomingGroupRow
              key={group.key}
              name={name}
              icon={icon}
              color={color}
              total={total}
              items={sorted}
            />
          );
        })}
      </ul>
    </div>
  );
}

function UpcomingGroupRow({
  name,
  icon,
  color,
  total,
  items,
}: {
  name: string;
  icon: string;
  color: string;
  total: number;
  items: UpcomingItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="py-1.5 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        {categoryGlyph(icon, color)}
        <span className="min-w-0 flex-1 truncate">
          {name}
          <span className="ml-1.5 text-xs text-muted-foreground">×{items.length}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          Next {format(new Date(items[0].date), "MMM d")}
        </span>
        <span className="w-14 shrink-0 text-right tabular-nums font-medium">
          {formatCurrency(total)}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ul className="mt-1.5 ml-[2.125rem] space-y-1 border-l border-border/60 pl-3">
          {items.map((item, i) => (
            <li
              key={`${item.id}-${item.date}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="min-w-0 flex-1 truncate">
                {format(new Date(item.date), "MMM d")}
              </span>
              <span className="shrink-0 tabular-nums">{formatCurrency(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function FiftyThirtyTwentyCard({ summary }: { summary: Summary | null }) {
  const income = summary?.totalIncome ?? 0;
  const groups = summary?.budgetGroups ?? [];
  const upcomingItems = summary?.upcomingItems ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          50 / 30 / 20 envelopes
          {upcomingItems.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {upcomingItems.length} scheduled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {income === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Add income this month to auto-split it into Needs / Wants / Savings.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {formatCurrency(income)} income this month, split automatically. Spending —
              including every recurring bill scheduled this month — comes out of its
              envelope right away.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {groups.map((g) => (
                <Envelope
                  key={g.group}
                  group={g.group}
                  allocated={g.allocated}
                  spentActual={g.spentActual}
                  spentUpcoming={g.spentUpcoming}
                  remaining={g.remaining}
                  targetPct={g.targetPct}
                />
              ))}
            </div>
            <UpcomingList items={upcomingItems} />
            <p className="text-xs text-muted-foreground">
              Tag categories as Needs, Wants, or Savings in the{" "}
              <span className="font-medium text-foreground">Categories</span> tab to route
              their spending into these envelopes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
