import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recurringSchema } from "@/lib/validation";

export async function GET() {
  const recurring = await prisma.recurringTransaction.findMany({
    include: { category: true },
    orderBy: { nextRunDate: "asc" },
  });
  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = recurringSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const startDate = parsed.data.startDate ?? new Date();
  const recurring = await prisma.recurringTransaction.create({
    data: {
      ...parsed.data,
      startDate,
      nextRunDate: startDate,
    },
    include: { category: true },
  });
  return NextResponse.json(recurring, { status: 201 });
}
