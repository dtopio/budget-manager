"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  SUBSCRIPTION_LABELS,
  isSubscriptionCategory,
  parseSubscriptionLabel,
} from "@/lib/subscription-labels";
import type { BudgetGroup, Summary } from "@/lib/types";

const GROUP_META: Record<
  BudgetGroup,
  { label: string; color: string; description: string }
> = {
  NEEDS: { label: "Needs", color: "#2a78d6", description: "Rent, groceries, utilities…" },
  WANTS: { label: "Wants", color: "#eb6834", description: "Dining out, subscriptions…" },
  SAVINGS: { label: "Savings", color: "#1baf7a", description: "Set aside for the future" },
};

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
    <div className="space-y-2 rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${meta.color}1f` }}
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
            overBudget && "text-[#d03b3b]"
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
            backgroundColor: overBudget ? "#d03b3b" : meta.color,
          }}
        />
        <div
          className="absolute top-0 h-full rounded-full opacity-40"
          style={{
            left: `${Math.min(actualPct, 100)}%`,
            width: `${Math.min(upcomingPct, 100 - Math.min(actualPct, 100))}%`,
            backgroundColor: overBudget ? "#d03b3b" : meta.color,
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

function UpcomingList({ items }: { items: Summary["upcomingItems"] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        Upcoming this month (already counted above)
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const isSub = isSubscriptionCategory(item.categoryName);
          const { label, detail } = parseSubscriptionLabel(item.note);
          const subIcon = isSub ? subscriptionIcon(label) : undefined;
          const Icon = getIcon(subIcon ?? item.categoryIcon ?? "Wallet");
          const color = item.categoryColor ?? "#64748b";
          const displayName = isSub && label ? label : item.categoryName ?? "Uncategorized";
          return (
            <li key={`${item.id}-${item.date}-${i}`} className="flex items-center gap-2.5 text-sm">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}1a` }}
              >
                <Icon className="h-3 w-3" style={{ color }} />
              </span>
              <span className="min-w-0 flex-1 truncate">
                {displayName}
                {detail && <span className="text-muted-foreground"> · {detail}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(new Date(item.date), "MMM d")}
              </span>
              <span className="shrink-0 tabular-nums font-medium">
                {formatCurrency(item.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
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
              {upcomingItems.length} upcoming
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
              including recurring bills due later this month — comes out of its envelope
              right away.
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
