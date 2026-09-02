"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarClock, MoreVertical, Pause, Pencil, Play, Trash2 } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const editingRecurring = bills.find((r) => r.id === editingId);

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
                <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25)]"
                    style={{
                      background: `linear-gradient(160deg, color-mix(in oklch, ${color} 20%, transparent), color-mix(in oklch, ${color} 9%, transparent))`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {r.category?.name ?? "Uncategorized"}
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {frequencyLabel[r.frequency]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                          style={
                            r.active
                              ? { color: "var(--income)", borderColor: "var(--income)" }
                              : undefined
                          }
                        >
                          {r.active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <span
                        className="shrink-0 text-sm font-semibold tabular-nums"
                        style={{
                          color: r.type === "INCOME" ? "var(--income)" : "var(--foreground)",
                        }}
                      >
                        {r.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(Number(r.amount))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Next {format(new Date(r.nextRunDate), "MMM d, yyyy")}
                        {r.note ? ` · ${r.note}` : ""}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleActive(r.id, r.active)}>
                        {r.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {r.active ? "Pause" : "Resume"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingId(r.id)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {editingRecurring && (
        <AddRecurringDialog
          categories={categories}
          recurring={editingRecurring}
          onCreated={onChanged}
          hideTrigger
          open={!!editingId}
          onOpenChange={(next) => setEditingId(next ? editingId : null)}
        />
      )}
    </Card>
  );
}
