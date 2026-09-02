"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

const INCOME_COLOR = "var(--income)";
const EXPENSE_COLOR = "var(--expense)";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-xl border border-border/70 bg-popover px-3 py-2.5 text-sm shadow-[var(--edge-top),var(--elev-3)]">
      <div className="text-[0.6875rem] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="mt-1.5 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color, boxShadow: `0 0 0 3px color-mix(in oklch, ${p.color} 18%, transparent)` }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CompactLegend() {
  return (
    <div className="mb-1 flex items-center justify-end gap-4 text-xs text-muted-foreground">
      {[
        { name: "Income", color: INCOME_COLOR },
        { name: "Expense", color: EXPENSE_COLOR },
      ].map((s) => (
        <span key={s.name} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses (6 months)</CardTitle>
      </CardHeader>
      <CardContent>
        <CompactLegend />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={5} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              {/* Each bar is lit from the top: full colour at the cap, easing off toward
                  the baseline so it reads as a solid with a face, not a flat block. */}
              <defs>
                {[
                  { id: "fillIncome", color: INCOME_COLOR },
                  { id: "fillExpense", color: EXPENSE_COLOR },
                ].map((g) => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={g.color} stopOpacity={0.72} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.6}
                strokeDasharray="2 6"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                width={44}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--foreground)", fillOpacity: 0.04, radius: 8 }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="url(#fillIncome)"
                radius={[5, 5, 2, 2]}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="url(#fillExpense)"
                radius={[5, 5, 2, 2]}
                maxBarSize={18}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
