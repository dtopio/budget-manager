"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailySpendDialog } from "@/components/budget/daily-spend-dialog";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown, Transaction } from "@/lib/types";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: CategoryBreakdown }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2.5 text-sm shadow-[var(--edge-top),var(--elev-3)]">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: item.payload.color,
            boxShadow: `0 0 0 3px color-mix(in oklch, ${item.payload.color} 18%, transparent)`,
          }}
        />
        <span className="font-medium text-popover-foreground">{item.name}</span>
      </div>
      <div className="mt-1 text-muted-foreground tabular-nums">
        {formatCurrency(item.value)}
      </div>
    </div>
  );
}

export function CategoryBreakdownChart({
  data,
  month,
  transactions,
}: {
  data: CategoryBreakdown[];
  month: Date;
  transactions: Transaction[];
}) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by Category</CardTitle>
          <DailySpendDialog month={month} transactions={transactions} />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No expenses this month yet.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
            <div className="relative mx-auto h-44 w-44 shrink-0 sm:h-48 sm:w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="99%"
                    paddingAngle={2}
                    cornerRadius={4}
                    strokeWidth={3}
                    stroke="var(--card)"
                    isAnimationActive={false}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* The hole is the obvious place for the figure the ring is dividing up. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Total
                </span>
                <span className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
            {/* Capped rather than flex-1: stretched across a wide card, `justify-between`
                drags the figures to the far edge and they stop reading as belonging to
                the label beside them. */}
            <ul className="w-full max-w-xs space-y-2">
              {data.map((entry) => {
                const pct = total > 0 ? (entry.total / total) * 100 : 0;
                return (
                  <li
                    key={entry.categoryId ?? entry.name}
                    className="grid grid-cols-[0.625rem_1fr_auto_2.25rem] items-center gap-x-2.5 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate">{entry.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(entry.total)}
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
