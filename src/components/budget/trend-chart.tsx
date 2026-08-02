"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

const INCOME_COLOR = "#2a78d6";
const EXPENSE_COLOR = "#e34948";

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
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium text-popover-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="mt-1 flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto tabular-nums">{formatCurrency(p.value)}</span>
        </div>
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
        <div className="h-70 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent)" }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill={INCOME_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill={EXPENSE_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
