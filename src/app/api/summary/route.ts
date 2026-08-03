import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { advance } from "@/lib/recurrence";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // YYYY-MM
  const anchor = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();

  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: from, lte: to } },
    include: { category: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalReimbursement = 0;
  const byCategory = new Map<
    string,
    { categoryId: string | null; name: string; color: string; total: number }
  >();
  const groupTotals: Record<"NEEDS" | "WANTS" | "SAVINGS", number> = {
    NEEDS: 0,
    WANTS: 0,
    SAVINGS: 0,
  };

  function adjustCategory(
    categoryId: string | null,
    name: string,
    color: string,
    group: "NEEDS" | "WANTS" | "SAVINGS" | null | undefined,
    delta: number
  ) {
    const key = categoryId ?? "uncategorized";
    const existing = byCategory.get(key);
    if (existing) {
      existing.total += delta;
    } else {
      byCategory.set(key, { categoryId, name, color, total: delta });
    }
    if (group) {
      groupTotals[group] += delta;
    }
  }

  // A reimbursement linked to an expense category directly offsets that
  // category's spend (net accounting), so it must be applied after all
  // expenses are tallied, regardless of row order from the database.
  const reimbursements: typeof transactions = [];

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.type === "INCOME") {
      totalIncome += amount;
    } else if (t.type === "REIMBURSEMENT") {
      reimbursements.push(t);
    } else {
      totalExpense += amount;
      adjustCategory(
        t.categoryId,
        t.category?.name ?? "Uncategorized",
        t.category?.color ?? "#64748b",
        t.category?.group,
        amount
      );
    }
  }

  for (const t of reimbursements) {
    const amount = Number(t.amount);
    if (t.categoryId && t.category?.type === "EXPENSE") {
      totalExpense -= amount;
      adjustCategory(t.categoryId, t.category.name, t.category.color, t.category.group, -amount);
    } else {
      totalReimbursement += amount;
    }
  }

  // Recurring rules that are due later this month haven't materialized into real
  // transactions yet (that only happens on/after their date via /api/recurring/run),
  // but they're committed spending — count them against the budget now rather than
  // waiting for the day to arrive. Anything due on/before "now" is already covered
  // by the actual-transactions query above, since /api/recurring/run runs first.
  const activeRecurring = await prisma.recurringTransaction.findMany({
    where: { active: true },
    include: { category: true },
  });

  const upcomingGroupTotals: Record<"NEEDS" | "WANTS" | "SAVINGS", number> = {
    NEEDS: 0,
    WANTS: 0,
    SAVINGS: 0,
  };
  let upcomingIncome = 0;
  let upcomingExpense = 0;
  const upcomingItems: {
    id: string;
    name: string;
    note: string | null;
    amount: number;
    date: string;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
  }[] = [];

  for (const rule of activeRecurring) {
    let occurrence = rule.nextRunDate;
    let guard = 0;
    while (occurrence <= to && guard < 366) {
      guard++;
      if (rule.endDate && occurrence > rule.endDate) break;
      if (occurrence >= from && occurrence <= to) {
        const amount = Number(rule.amount);
        if (rule.type === "INCOME") {
          upcomingIncome += amount;
        } else {
          upcomingExpense += amount;
          if (rule.category?.group) {
            upcomingGroupTotals[rule.category.group] += amount;
          }
          upcomingItems.push({
            id: rule.id,
            name: rule.category?.name ?? "Uncategorized",
            note: rule.note,
            amount,
            date: occurrence.toISOString(),
            categoryName: rule.category?.name ?? null,
            categoryIcon: rule.category?.icon ?? null,
            categoryColor: rule.category?.color ?? null,
          });
        }
      }
      occurrence = advance(occurrence, rule.frequency);
    }
  }
  upcomingItems.sort((a, b) => a.date.localeCompare(b.date));

  const TARGET_PCT = { NEEDS: 50, WANTS: 30, SAVINGS: 20 } as const;
  const budgetGroups = (["NEEDS", "WANTS", "SAVINGS"] as const).map((group) => {
    const targetPct = TARGET_PCT[group];
    const allocated = (totalIncome * targetPct) / 100;
    const spentActual = groupTotals[group];
    const spentUpcoming = upcomingGroupTotals[group];
    const spent = spentActual + spentUpcoming;
    return {
      group,
      targetPct,
      allocated,
      spentActual,
      spentUpcoming,
      spent,
      remaining: allocated - spent,
      total: spent, // kept for backward compat with existing chart code
    };
  });

  // Last 6 months trend
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(anchor, i);
    const mFrom = startOfMonth(monthDate);
    const mTo = endOfMonth(monthDate);
    const monthTx = await prisma.transaction.findMany({
      where: { date: { gte: mFrom, lte: mTo } },
      include: { category: true },
    });
    let income = 0;
    let expense = 0;
    for (const t of monthTx) {
      const amount = Number(t.amount);
      if (t.type === "INCOME") income += amount;
      else if (t.type === "EXPENSE") expense += amount;
      else if (t.type === "REIMBURSEMENT" && t.categoryId && t.category?.type === "EXPENSE") {
        expense -= amount;
      }
    }
    trend.push({ month: format(monthDate, "MMM"), income, expense });
  }

  return NextResponse.json({
    month: format(anchor, "yyyy-MM"),
    totalIncome,
    totalExpense,
    totalReimbursement,
    balance: totalIncome - totalExpense + totalReimbursement,
    byCategory: Array.from(byCategory.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total),
    trend,
    budgetGroups,
    upcomingIncome,
    upcomingExpense,
    upcomingItems,
  });
}
