import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { advance } from "@/lib/recurrence";

// Materializes any recurring transactions that are due into real transactions.
// Safe to call repeatedly and concurrently (the dashboard calls it on every load).
export async function POST() {
  const now = new Date();
  const due = await prisma.recurringTransaction.findMany({
    where: {
      active: true,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  let createdCount = 0;

  for (const rule of due) {
    // Collect the occurrences this run is responsible for before touching the database,
    // so the write side is a single short transaction.
    const occurrences: Date[] = [];
    let nextRunDate = rule.nextRunDate;
    while (nextRunDate <= now && (!rule.endDate || nextRunDate <= rule.endDate)) {
      occurrences.push(nextRunDate);
      nextRunDate = advance(nextRunDate, rule.frequency);
    }
    if (occurrences.length === 0) continue;

    // Claim the rule with a compare-and-swap on the nextRunDate we observed: only the
    // caller whose update actually matches gets to write the transactions. Without this,
    // two overlapping calls (a double-click, two open tabs) would both read the same due
    // rule and each materialize the same charge, silently doubling it.
    const claimed = await prisma.$transaction(async (tx) => {
      const claim = await tx.recurringTransaction.updateMany({
        where: { id: rule.id, nextRunDate: rule.nextRunDate },
        data: { nextRunDate },
      });
      if (claim.count === 0) return 0;

      await tx.transaction.createMany({
        data: occurrences.map((date) => ({
          amount: rule.amount,
          type: rule.type,
          note: rule.note,
          date,
          categoryId: rule.categoryId,
          recurringId: rule.id,
        })),
      });
      return occurrences.length;
    });

    createdCount += claimed;
  }

  return NextResponse.json({ createdCount });
}
