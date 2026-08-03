"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HEAT_COLOR = "#d03b3b";

type DaySpend = { net: number; items: Transaction[] };

function dailySpend(transactions: Transaction[]) {
  const map = new Map<string, DaySpend>();
  for (const t of transactions) {
    if (t.type === "INCOME") continue;
    const isOffset = t.type === "REIMBURSEMENT" && t.categoryId && t.category?.type === "EXPENSE";
    if (t.type === "REIMBURSEMENT" && !isOffset) continue;

    const key = format(new Date(t.date), "yyyy-MM-dd");
    const amount = Number(t.amount);
    const existing = map.get(key);
    const delta = isOffset ? -amount : amount;
    if (existing) {
      existing.net += delta;
      existing.items.push(t);
    } else {
      map.set(key, { net: delta, items: [t] });
    }
  }
  return map;
}

function DayCell({ date, inMonth, spend, maxNet }: {
  date: Date;
  inMonth: boolean;
  spend: DaySpend | undefined;
  maxNet: number;
}) {
  const net = spend?.net ?? 0;
  const intensity = maxNet > 0 && net > 0 ? Math.min(net / maxNet, 1) : 0;

  return (
    <div className="group relative">
      <div
        className={cn(
          "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs",
          inMonth ? "border-border/60" : "border-transparent text-muted-foreground/40",
          isToday(date) && inMonth && "ring-1 ring-primary/60"
        )}
        style={
          inMonth && intensity > 0
            ? { backgroundColor: HEAT_COLOR, opacity: 0.12 + intensity * 0.68 }
            : undefined
        }
      >
        <span
          className={cn(
            "font-medium",
            inMonth && intensity > 0.35 ? "text-white" : "text-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        {inMonth && net > 0 && (
          <span
            className={cn(
              "tabular-nums",
              intensity > 0.35 ? "text-white/90" : "text-muted-foreground"
            )}
          >
            {formatCurrency(net)}
          </span>
        )}
      </div>

      {inMonth && spend && spend.items.length > 0 && (
        <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 w-48 -translate-x-1/2 rounded-md border bg-popover p-2 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          <p className="mb-1 font-medium text-popover-foreground">
            {format(date, "EEEE, MMM d")}
          </p>
          <ul className="max-h-32 space-y-0.5 overflow-y-auto">
            {spend.items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="min-w-0 truncate">
                  {t.category?.name ?? "Uncategorized"}
                  {t.note ? ` · ${t.note}` : ""}
                </span>
                <span className="shrink-0 tabular-nums">
                  {t.type === "REIMBURSEMENT" ? "-" : ""}
                  {formatCurrency(Number(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DailySpendDialog({
  month,
  transactions,
}: {
  month: Date;
  transactions: Transaction[];
}) {
  const [open, setOpen] = useState(false);

  const spendByDay = dailySpend(transactions);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  let maxNet = 0;
  let topDay: { date: string; net: number } | null = null;
  for (const [key, spend] of spendByDay) {
    if (spend.net > maxNet) maxNet = spend.net;
    if (spend.net > 0 && (!topDay || spend.net > topDay.net)) {
      topDay = { date: key, net: spend.net };
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily spending — {format(month, "MMMM yyyy")}</DialogTitle>
        </DialogHeader>

        {topDay && (
          <p className="text-sm text-muted-foreground">
            You spent the most on{" "}
            <span className="font-medium text-foreground">
              {format(new Date(`${topDay.date}T00:00:00`), "MMM d")}
            </span>{" "}
            — {formatCurrency(topDay.net)}
          </p>
        )}

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {gridDays.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            return (
              <DayCell
                key={key}
                date={date}
                inMonth={isSameMonth(date, month)}
                spend={spendByDay.get(key)}
                maxNet={maxNet}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
