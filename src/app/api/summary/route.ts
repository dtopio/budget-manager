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

  const trendRanges = Array.from({ length: 6 }, (_, idx) => {
    const monthDate = subMonths(anchor, 5 - idx);
    return { monthDate, mFrom: startOfMonth(monthDate), mTo: endOfMonth(monthDate) };
  });

  const [transactions, activeRecurring, trendTx, savingsRows] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true },
    }),
    prisma.recurringTransaction.findMany({
      where: { active: true },
      include: { category: true },
    }),
    Promise.all(
      trendRanges.map(({ mFrom, mTo }) =>
        prisma.transaction.findMany({
          where: { date: { gte: mFrom, lte: mTo } },
          include: { category: true },
        })
      )
    ),
    // The savings pot is cumulative, not monthly: everything ever put in or taken out,
    // up to the end of the month being viewed. Viewing an earlier month therefore shows
    // the pot as it stood then, rather than today's figure.
    prisma.transaction.findMany({
      where: { fundingSource: "SAVINGS", date: { lte: to } },
      select: { amount: true, type: true, date: true },
    }),
  ]);

  let savingsBalance = 0;
  let savingsSpent = 0;
  for (const t of savingsRows) {
    const amount = Number(t.amount);
    if (t.type === "EXPENSE") {
      savingsBalance -= amount;
      if (t.date >= from) savingsSpent += amount;
    } else {
      savingsBalance += amount;
    }
  }

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
    // Money moving in or out of savings is a different pot — counting it here would make
    // "left to spend" and the envelopes reflect money this month never had.
    if (t.fundingSource === "SAVINGS") continue;
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
    if (t.fundingSource === "SAVINGS") continue;
    const amount = Number(t.amount);
    if (t.categoryId && t.category?.type === "EXPENSE") {
      totalExpense -= amount;
      adjustCategory(t.categoryId, t.category.name, t.category.color, t.category.group, -amount);
    } else {
      totalReimbursement += amount;
    }
  }

  // Recurring rules that haven't materialized into real transactions yet (that only
  // happens on/after their date via /api/recurring/run) are still committed spending —
  // count them against the budget now rather than waiting for the day to arrive.
  //
  // The schedule is walked from each rule's startDate, not its nextRunDate, because an
  // occurrence whose run was skipped (nextRunDate advanced past it without a transaction
  // being written) would otherwise vanish from the month entirely — neither an actual nor
  // an upcoming. Occurrences that DID materialize are already in the actuals above, so
  // they're filtered out here by rule + day to avoid double counting.
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

  const materialized = new Set<string>();
  for (const t of transactions) {
    if (t.recurringId) {
      materialized.add(`${t.recurringId}:${format(t.date, "yyyy-MM-dd")}`);
    }
  }

  for (const rule of activeRecurring) {
    let occurrence = rule.startDate < rule.nextRunDate ? rule.startDate : rule.nextRunDate;
    let guard = 0;
    while (occurrence <= to && guard < 4000) {
      guard++;
      if (rule.endDate && occurrence > rule.endDate) break;
      if (
        occurrence >= from &&
        occurrence <= to &&
        !materialized.has(`${rule.id}:${format(occurrence, "yyyy-MM-dd")}`)
      ) {
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
  const trend = trendRanges.map(({ monthDate }, idx) => {
    let income = 0;
    let expense = 0;
    for (const t of trendTx[idx]) {
      if (t.fundingSource === "SAVINGS") continue;
      const amount = Number(t.amount);
      if (t.type === "INCOME") income += amount;
      else if (t.type === "EXPENSE") expense += amount;
      else if (t.type === "REIMBURSEMENT" && t.categoryId && t.category?.type === "EXPENSE") {
        expense -= amount;
      }
    }
    return { month: format(monthDate, "MMM"), income, expense };
  });

  return NextResponse.json({
    month: format(anchor, "yyyy-MM"),
    totalIncome,
    totalExpense,
    totalReimbursement,
    balance: totalIncome - totalExpense + totalReimbursement,
    // What's genuinely left: this month's balance with the recurring bills that are still
    // to come already taken out, so the headline number doesn't quietly overstate things
    // days before rent or a subscription lands. Upcoming income is deliberately not added
    // — money not yet received isn't money you can spend.
    available: totalIncome - totalExpense + totalReimbursement - upcomingExpense,
    savingsBalance,
    savingsSpent,
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
