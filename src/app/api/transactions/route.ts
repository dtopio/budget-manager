import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type");

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(type ? { type: type as "INCOME" | "EXPENSE" | "REIMBURSEMENT" } : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const transaction = await prisma.transaction.create({
    data: parsed.data,
    include: { category: true },
  });
  return NextResponse.json(transaction, { status: 201 });
}
