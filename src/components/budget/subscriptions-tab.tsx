"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import {
  SUBSCRIPTION_LABELS,
  isSubscriptionCategory,
  parseSubscriptionLabel,
} from "@/lib/subscription-labels";
import { AddRecurringDialog } from "@/components/budget/add-recurring-dialog";
import type { Category, RecurringTransaction } from "@/lib/types";

const MONTHLY_EQUIVALENT: Record<string, number> = {
  DAILY: 30.44,
  WEEKLY: 4.345,
  MONTHLY: 1,
  YEARLY: 1 / 12,
};

const frequencyLabel: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function subscriptionIcon(label: string | null) {
  return SUBSCRIPTION_LABELS.find((s) => s.name === label)?.icon;
}

export function SubscriptionsTab({
  recurring,
  categories,
  onChanged,
}: {
  recurring: RecurringTransaction[];
  categories: Category[];
  onChanged: () => void;
}) {
  const subs = recurring.filter(
    (r) => r.type === "EXPENSE" && isSubscriptionCategory(r.category?.name)
  );

  const monthlyTotal = subs
    .filter((r) => r.active)
    .reduce((sum, r) => sum + Number(r.amount) * MONTHLY_EQUIVALENT[r.frequency], 0);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Subscription removed");
      onChanged();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-border/60 p-5 shadow-sm">
        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#4a3aa7] opacity-[0.12]" />
        <span className="text-sm font-medium text-muted-foreground">
          Active subscriptions, normalized to monthly
        </span>
        <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(monthlyTotal)}
          <span className="text-base font-normal text-muted-foreground"> / mo</span>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No subscriptions yet. Add a recurring transaction under the{" "}
              <span className="font-medium text-foreground">Subscriptions</span> category to
              track it here.
            </p>
          ) : (
            <ul className="divide-y">
              {subs.map((r) => {
                const { label, detail } = parseSubscriptionLabel(r.note);
                const icon = subscriptionIcon(label) ?? r.category?.icon ?? "Repeat";
                const Icon = getIcon(icon);
                const color = r.category?.color ?? "#64748b";
                const monthlyCost = Number(r.amount) * MONTHLY_EQUIVALENT[r.frequency];
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}1a` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate text-sm font-medium">
                        {label ?? r.category?.name ?? "Subscription"}
                        <Badge variant="secondary" className="text-xs">
                          {frequencyLabel[r.frequency]}
                        </Badge>
                        {!r.active && (
                          <Badge variant="outline" className="text-xs">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Next: {format(new Date(r.nextRunDate), "MMM d, yyyy")}
                        {detail ? ` · ${detail}` : ""}
                        {r.frequency !== "MONTHLY" &&
                          ` · ${formatCurrency(monthlyCost)}/mo equiv.`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(r.amount))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        / {frequencyLabel[r.frequency].toLowerCase()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => toggleActive(r.id, r.active)}
                    >
                      {r.active ? "Pause" : "Resume"}
                    </Button>
                    <AddRecurringDialog
                      categories={categories}
                      recurring={r}
                      onCreated={onChanged}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
