"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Trash2 } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
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

function amountStyle(type: Transaction["type"]) {
  if (type === "INCOME") return { sign: "+", color: "#0ca30c" };
  if (type === "REIMBURSEMENT") return { sign: "+", color: "#2a78d6" };
  return { sign: "-", color: "#0b0b0b" };
}

function fallbackDisplay(type: Transaction["type"]) {
  if (type === "REIMBURSEMENT") return { name: "Reimbursement", icon: "Undo2", color: "#2a78d6" };
  return { name: "Uncategorized", icon: "Wallet", color: "#64748b" };
}

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

function groupByDay(transactions: Transaction[]) {
  const groups: { key: string; label: string; items: Transaction[] }[] = [];
  for (const t of transactions) {
    const date = new Date(t.date);
    const key = format(date, "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(t);
    } else {
      groups.push({ key, label: dayLabel(date), items: [t] });
    }
  }
  return groups;
}

function categoryGlyph(iconName: string, color: string) {
  const Icon = getIcon(iconName);
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}1a` }}
    >
      <Icon className="h-4 w-4" style={{ color }} />
    </span>
  );
}

function TransactionGroupRow({
  iconName,
  color,
  displayName,
  countLabel,
  total,
  sign,
  amountColor,
  items,
  onDelete,
}: {
  iconName: string;
  color: string;
  displayName: string;
  countLabel: string;
  total: number;
  sign: string;
  amountColor: string;
  items: Transaction[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
      >
        {categoryGlyph(iconName, color)}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate text-sm font-medium">
            {displayName}
            <Badge variant="secondary" className="text-[10px] font-normal">
              {items.length} {countLabel}
            </Badge>
          </div>
        </div>
        <div className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: amountColor }}>
          {sign}
          {formatCurrency(total)}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </span>
      </button>
      {expanded && (
        <ul className="mt-1.5 ml-[2.75rem] border-l border-border/60 pl-3">
          {items.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 py-1 text-xs text-muted-foreground"
            >
              <span className="min-w-0 flex-1 truncate">{t.note || "No note"}</span>
              <span className="shrink-0 tabular-nums">{formatCurrency(Number(t.amount))}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onDelete(t.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function groupByCategory(transactions: Transaction[]) {
  const groups: { key: string; items: Transaction[] }[] = [];
  const byKey = new Map<string, { key: string; items: Transaction[] }>();
  for (const t of transactions) {
    const key = `${t.type}-${t.categoryId ?? "uncategorized"}`;
    let group = byKey.get(key);
    if (!group) {
      group = { key, items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(t);
  }
  return groups;
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
          <div className="space-y-4">
            {groupByDay(transactions).map((group) => (
              <div key={group.key}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                <ul className="divide-y">
                  {groupByCategory(group.items).map((catGroup) => {
                    const first = catGroup.items[0];
                    const isSub = isSubscriptionCategory(first.category?.name);
                    const total = catGroup.items.reduce((sum, t) => sum + Number(t.amount), 0);
                    const fallback = fallbackDisplay(first.type);
                    const displayName = first.category?.name ?? fallback.name;
                    const iconName = first.category?.icon ?? fallback.icon;
                    const color = first.category?.color ?? fallback.color;
                    const { sign, color: amountColor } = amountStyle(first.type);
                    const countLabel =
                      first.type === "EXPENSE"
                        ? "expenses"
                        : first.type === "INCOME"
                          ? "entries"
                          : "reimbursements";

                    if (catGroup.items.length === 1) {
                      const t = first;
                      const { label, detail } = parseSubscriptionLabel(t.note);
                      const subIcon = isSub ? subscriptionIcon(label) : undefined;
                      const SingleIcon = getIcon(subIcon ?? t.category?.icon ?? fallback.icon);
                      return (
                        <li
                          key={catGroup.key}
                          className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${color}1a` }}
                          >
                            <SingleIcon className="h-4 w-4" style={{ color }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {displayName}
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
                            style={{ color: amountColor }}
                          >
                            {sign}
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
                    }

                    return (
                      <TransactionGroupRow
                        key={catGroup.key}
                        iconName={iconName}
                        color={color}
                        displayName={displayName}
                        countLabel={countLabel}
                        total={total}
                        sign={sign}
                        amountColor={amountColor}
                        items={catGroup.items}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
