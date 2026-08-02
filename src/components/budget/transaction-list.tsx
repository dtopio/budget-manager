"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import {
  SUBSCRIPTION_LABELS,
  isSubscriptionCategory,
  parseSubscriptionLabel,
} from "@/lib/subscription-labels";
import type { Transaction } from "@/lib/types";

function subscriptionIcon(label: string | null) {
  return SUBSCRIPTION_LABELS.find((s) => s.name === label)?.icon;
}

export function TransactionList({
  transactions,
  onChanged,
}: {
  transactions: Transaction[];
  onChanged: () => void;
}) {
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Transaction deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions this month.
          </p>
        ) : (
          <ul className="divide-y">
            {transactions.map((t) => {
              const isSub = isSubscriptionCategory(t.category?.name);
              const { label, detail } = parseSubscriptionLabel(t.note);
              const subIcon = isSub ? subscriptionIcon(label) : undefined;
              const Icon = getIcon(subIcon ?? t.category?.icon ?? "Wallet");
              const color = t.category?.color ?? "#64748b";
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1a` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {t.category?.name ?? "Uncategorized"}
                      {isSub && label && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {label}
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {!isSub && t.note ? `${t.note} · ` : ""}
                      {isSub && detail ? `${detail} · ` : ""}
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div
                    className="shrink-0 text-sm font-semibold tabular-nums"
                    style={{ color: t.type === "INCOME" ? "#0ca30c" : "#0b0b0b" }}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(t.amount))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(t.id)}
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
