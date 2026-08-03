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
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="mx-auto h-55 w-55 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    strokeWidth={2}
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
            </div>
            <ul className="flex-1 space-y-2">
              {data.map((entry) => {
                const pct = total > 0 ? (entry.total / total) * 100 : 0;
                return (
                  <li
                    key={entry.categoryId ?? entry.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">
                      <span>{formatCurrency(entry.total)}</span>
                      <span className="w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
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
