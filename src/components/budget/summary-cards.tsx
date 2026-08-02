import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Summary } from "@/lib/types";

function StatCard({
  label,
  value,
  Icon,
  tint,
  valueClassName,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tint: string;
  valueClassName?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.12]"
        style={{ backgroundColor: tint }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tint}1f` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: tint }} />
        </span>
      </div>
      <div
        className={cn("mt-3 text-3xl font-semibold tracking-tight tabular-nums", valueClassName)}
      >
        {formatCurrency(value)}
      </div>
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: Summary | null }) {
  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;
  const balance = summary?.balance ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Income" value={income} Icon={ArrowUpRight} tint="#0ca30c" />
      <StatCard label="Expenses" value={expense} Icon={ArrowDownRight} tint="#d03b3b" />
      <StatCard
        label="Balance"
        value={balance}
        Icon={Wallet}
        tint={balance >= 0 ? "#0ca30c" : "#d03b3b"}
      />
    </div>
  );
}
