import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { advance } from "@/lib/recurrence";

// Materializes any recurring transactions that are due into real transactions.
// Safe to call repeatedly (e.g. on every dashboard load).
export async function POST() {
  const now = new Date();
  const due = await prisma.recurringTransaction.findMany({
    where: {
      active: true,
      nextRunDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  const created = [];
  for (const rule of due) {
    let nextRunDate = rule.nextRunDate;
    while (nextRunDate <= now && (!rule.endDate || nextRunDate <= rule.endDate)) {
      const transaction = await prisma.transaction.create({
        data: {
          amount: rule.amount,
          type: rule.type,
          note: rule.note,
          date: nextRunDate,
          categoryId: rule.categoryId,
          recurringId: rule.id,
        },
      });
      created.push(transaction);
      nextRunDate = advance(nextRunDate, rule.frequency);
    }
    await prisma.recurringTransaction.update({
      where: { id: rule.id },
      data: { nextRunDate },
    });
  }

  return NextResponse.json({ createdCount: created.length });
}
