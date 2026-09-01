import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { advance } from "@/lib/recurrence";
import { format, startOfMonth, subMonths } from "date-fns";

// How far back a reconcile will look for occurrences that were never written. Bounded so
// a rule with an old startDate can't dump years of backdated history into the ledger the
// first time this runs.
const BACKFILL_MONTHS = 1;

/**
 * Reconciles recurring rules against the ledger: every occurrence on or before now that
 * doesn't already have a transaction gets one.
 *
 * This is a reconcile rather than a "walk forward from nextRunDate" because the two can
 * disagree. If nextRunDate ever advances past an occurrence without the transaction being
 * written, walking forward would skip that charge permanently — it is behind the pointer,
 * so no future run would ever revisit it. That is exactly what happened to the Sep 1
 * charges: the summary counted them as scheduled, but no transaction existed and none
 * ever would. Matching on rule + day makes the pass idempotent, so re-running is free.
 *
 * Safe to call repeatedly and concurrently (the dashboard calls it on every load).
 */
export async function POST() {
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, BACKFILL_MONTHS));

  const rules = await prisma.recurringTransaction.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: windowStart } }],
    },
  });
  if (rules.length === 0) return NextResponse.json({ createdCount: 0 });

  // One query for everything already written in the window, keyed by rule + calendar day.
  const existing = await prisma.transaction.findMany({
    where: {
      recurringId: { in: rules.map((r) => r.id) },
      date: { gte: windowStart, lte: now },
    },
    select: { recurringId: true, date: true },
  });
  const alreadyWritten = new Set(
    existing.map((t) => `${t.recurringId}:${format(t.date, "yyyy-MM-dd")}`)
  );

  let createdCount = 0;

  for (const rule of rules) {
    const missing: Date[] = [];
    let occurrence = rule.startDate;
    let nextRunDate = rule.nextRunDate;
    let guard = 0;

    while (occurrence <= now && guard < 4000) {
      guard++;
      if (rule.endDate && occurrence > rule.endDate) break;
      if (occurrence >= windowStart && !alreadyWritten.has(`${rule.id}:${format(occurrence, "yyyy-MM-dd")}`)) {
        missing.push(occurrence);
      }
      occurrence = advance(occurrence, rule.frequency);
    }

    // `occurrence` is now the first one after `now` — the correct pointer regardless of
    // where it had drifted to.
    if (!rule.endDate || occurrence <= rule.endDate) nextRunDate = occurrence;

    const pointerMoved = nextRunDate.getTime() !== rule.nextRunDate.getTime();
    if (missing.length === 0 && !pointerMoved) continue;

    // Concurrency is handled by the unique index on (recurringId, date) rather than by
    // guarding the pointer: skipDuplicates makes a losing racer a no-op instead of a
    // second charge. A pointer-only CAS could not do this job — when the pointer doesn't
    // move (a pure backfill), two callers would both match it and both insert.
    const written = await prisma.$transaction(async (tx) => {
      const inserted =
        missing.length > 0
          ? await tx.transaction.createMany({
              data: missing.map((date) => ({
                amount: rule.amount,
                type: rule.type,
                note: rule.note,
                date,
                categoryId: rule.categoryId,
                recurringId: rule.id,
              })),
              skipDuplicates: true,
            })
          : { count: 0 };

      if (pointerMoved) {
        await tx.recurringTransaction.update({
          where: { id: rule.id },
          data: { nextRunDate },
        });
      }
      return inserted.count;
    });

    createdCount += written;
  }

  return NextResponse.json({ createdCount });
}
