import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowDownRight, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS, GLASS_SHEEN } from "@/lib/glass";
import type { Summary } from "@/lib/types";

function StatCard({
  label,
  value,
  Icon,
  tint,
  hint,
  valueClassName,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tint: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={cn("p-5 transition-shadow hover:shadow-lg", GLASS, GLASS_SHEEN)}>
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.12]"
        style={{ backgroundColor: tint }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklch, ${tint} 15%, transparent)` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: tint }} />
        </span>
      </div>
      <div
        className={cn("mt-3 text-3xl font-semibold tracking-tight tabular-nums", valueClassName)}
      >
        {formatCurrency(value)}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{hint}</p>}
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: Summary | null }) {
  const expense = summary?.totalExpense ?? 0;
  const savings = summary?.savingsBalance ?? 0;
  const savingsSpent = summary?.savingsSpent ?? 0;
  // The headline figure is what's actually left after the bills still to come, not the
  // raw month balance — that number reads as spendable when it isn't.
  const available = summary?.available ?? 0;
  const upcoming = summary?.upcomingExpense ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Savings"
        value={savings}
        Icon={PiggyBank}
        tint="var(--savings)"
        hint={
          savingsSpent > 0
            ? `${formatCurrency(savingsSpent)} drawn this month`
            : "across all months"
        }
      />
      <StatCard label="Expenses" value={expense} Icon={ArrowDownRight} tint="var(--expense)" />
      <StatCard
        label="Left to spend"
        value={available}
        Icon={Wallet}
        tint={available >= 0 ? "var(--income)" : "var(--expense)"}
        hint={
          upcoming > 0
            ? `after ${formatCurrency(upcoming)} of bills still due`
            : "no bills left this month"
        }
      />
    </div>
  );
}
