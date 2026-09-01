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

// Discrete steps read far better than a continuous ramp: neighbouring days become
// comparable at a glance instead of blending into each other. Alpha is baked into the
// background colour rather than set via `opacity` on the cell, which would fade the
// label along with the tint and make the lightest days unreadable.
const HEAT_STEPS = [
  { bg: "color-mix(in oklch, var(--expense) 12%, transparent)", onDark: false },
  { bg: "color-mix(in oklch, var(--expense) 30%, transparent)", onDark: false },
  { bg: "color-mix(in oklch, var(--expense) 58%, transparent)", onDark: true },
  { bg: "color-mix(in oklch, var(--expense) 85%, transparent)", onDark: true },
];

function heatStep(net: number, maxNet: number) {
  if (net <= 0 || maxNet <= 0) return null;
  const ratio = net / maxNet;
  if (ratio <= 0.25) return HEAT_STEPS[0];
  if (ratio <= 0.5) return HEAT_STEPS[1];
  if (ratio <= 0.75) return HEAT_STEPS[2];
  return HEAT_STEPS[3];
}

// Cells are small — whole dollars keep the grid scannable; the tooltip has exact figures.
function compactAmount(net: number) {
  if (net >= 1000) return `$${(net / 1000).toFixed(1)}k`;
  return `$${Math.round(net)}`;
}

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

function DayCell({ date, inMonth, spend, maxNet, flipTooltip }: {
  date: Date;
  inMonth: boolean;
  spend: DaySpend | undefined;
  maxNet: number;
  flipTooltip: boolean;
}) {
  const net = spend?.net ?? 0;
  const step = inMonth ? heatStep(net, maxNet) : null;
  const today = isToday(date) && inMonth;

  return (
    <div className="group relative">
      <div
        className={cn(
          "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-transform",
          step ? "border-transparent" : "border-border/60",
          !inMonth && "border-transparent bg-transparent",
          spend && inMonth && "group-hover:scale-105",
          today && "ring-2 ring-primary ring-offset-1 ring-offset-background"
        )}
        style={step ? { backgroundColor: step.bg } : undefined}
      >
        <span
          className={cn(
            "font-medium leading-none",
            !inMonth && "text-muted-foreground/35",
            inMonth && step?.onDark && "text-white",
            inMonth && !step?.onDark && "text-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        {inMonth && net > 0 && (
          <span
            className={cn(
              "leading-none tabular-nums",
              step?.onDark ? "text-white/85" : "text-muted-foreground"
            )}
          >
            {compactAmount(net)}
          </span>
        )}
      </div>

      {inMonth && spend && spend.items.length > 0 && (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-52 -translate-x-1/2 rounded-lg border bg-popover p-2.5 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
            flipTooltip ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-2 border-b pb-1.5">
            <p className="font-medium text-popover-foreground">
              {format(date, "EEE, MMM d")}
            </p>
            <p className="shrink-0 font-medium tabular-nums text-popover-foreground">
              {formatCurrency(net)}
            </p>
          </div>
          <ul className="max-h-32 space-y-1 overflow-y-auto">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-2.5 py-2">
      <div className="truncate text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
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
  let monthTotal = 0;
  let activeDays = 0;
  let topDay: { date: string; net: number } | null = null;
  for (const [key, spend] of spendByDay) {
    if (spend.net > maxNet) maxNet = spend.net;
    if (spend.net > 0) {
      monthTotal += spend.net;
      activeDays++;
      if (!topDay || spend.net > topDay.net) topDay = { date: key, net: spend.net };
    }
  }
  const weekCount = gridDays.length / 7;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Daily spending — {format(month, "MMMM yyyy")}</DialogTitle>
        </DialogHeader>

        {topDay ? (
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Total" value={formatCurrency(monthTotal)} />
            <Stat label="Avg / spending day" value={formatCurrency(monthTotal / activeDays)} />
            <Stat
              label={`Busiest — ${format(new Date(`${topDay.date}T00:00:00`), "MMM d")}`}
              value={formatCurrency(topDay.net)}
            />
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No spending recorded this month.
          </p>
        )}

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              {d}
            </div>
          ))}
          {gridDays.map((date, i) => {
            const key = format(date, "yyyy-MM-dd");
            return (
              <DayCell
                key={key}
                date={date}
                inMonth={isSameMonth(date, month)}
                spend={spendByDay.get(key)}
                maxNet={maxNet}
                // The last two rows would push their tooltip past the dialog edge.
                flipTooltip={Math.floor(i / 7) >= weekCount - 2}
              />
            );
          })}
        </div>

        {topDay && (
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            <span className="h-3 w-3 rounded-sm border border-border/60" />
            {HEAT_STEPS.map((step) => (
              <span
                key={step.bg}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: step.bg }}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
