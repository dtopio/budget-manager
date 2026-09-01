"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import { isSubscriptionCategory } from "@/lib/subscription-labels";
import { AddRecurringDialog } from "@/components/budget/add-recurring-dialog";
import type { Category, RecurringTransaction } from "@/lib/types";

const frequencyLabel: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function RecurringList({
  recurring,
  categories,
  onChanged,
}: {
  recurring: RecurringTransaction[];
  categories: Category[];
  onChanged: () => void;
}) {
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Recurring transaction removed");
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

  // Subscriptions are recurring too, but they have their own dedicated tab with a
  // monthly-normalized total — keep this list to everything else so the two don't
  // just mirror each other.
  // Match the Subscriptions tab's filter exactly (it only claims EXPENSE rows), so an
  // income rule under a subscription-ish category can't fall through both tabs.
  const bills = recurring.filter(
    (r) => !(r.type === "EXPENSE" && isSubscriptionCategory(r.category?.name))
  );
  const subscriptionCount = recurring.length - bills.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring bills &amp; income</CardTitle>
        <CardDescription>
          Everything that repeats on a schedule, except subscriptions.
          {subscriptionCount > 0 && (
            <>
              {" "}
              {subscriptionCount} subscription{subscriptionCount === 1 ? " lives" : "s live"}{" "}
              in the <span className="font-medium text-foreground">Subscriptions</span> tab.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recurring bills or income set up yet.
          </p>
        ) : (
          <ul className="divide-y">
            {bills.map((r) => {
              const Icon = getIcon(r.category?.icon ?? "Wallet");
              const color = r.category?.color ?? "var(--muted-foreground)";
              return (
                <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate text-sm font-medium">
                      {r.category?.name ?? "Uncategorized"}
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
                      {r.note ? ` · ${r.note}` : ""}
                    </div>
                  </div>
                  <div
                    className="shrink-0 text-sm font-semibold tabular-nums"
                    style={{
                      color: r.type === "INCOME" ? "var(--income)" : "var(--foreground)",
                    }}
                  >
                    {r.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(r.amount))}
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
  );
}
