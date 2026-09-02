"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { GLASS, GLASS_SHEEN } from "@/lib/glass";
import { cn } from "@/lib/utils";
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const subs = recurring.filter(
    (r) => r.type === "EXPENSE" && isSubscriptionCategory(r.category?.name)
  );
  const editingRecurring = subs.find((r) => r.id === editingId);

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
      <Card className={cn("p-5", GLASS, GLASS_SHEEN)}>
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.14]"
          style={{ backgroundColor: "var(--transfer)" }}
        />
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
                const color = r.category?.color ?? "var(--muted-foreground)";
                const monthlyCost = Number(r.amount) * MONTHLY_EQUIVALENT[r.frequency];
                return (
                  <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25)]"
                      style={{
                        background: `linear-gradient(160deg, color-mix(in oklch, ${color} 20%, transparent), color-mix(in oklch, ${color} 9%, transparent))`,
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {label ?? r.category?.name ?? "Subscription"}
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
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold tabular-nums">
                            {formatCurrency(Number(r.amount))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            / {frequencyLabel[r.frequency].toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Next {format(new Date(r.nextRunDate), "MMM d, yyyy")}
                          {detail ? ` · ${detail}` : ""}
                          {r.frequency !== "MONTHLY" &&
                            ` · ${formatCurrency(monthlyCost)}/mo equiv.`}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />
                        }
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleActive(r.id, r.active)}>
                          {r.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {r.active ? "Pause" : "Resume"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingId(r.id)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(r.id)}
                        >
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
      </Card>
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
    </div>
  );
}
