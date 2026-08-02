import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionUpdateSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const transaction = await prisma.transaction.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });
  return NextResponse.json(transaction);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.transaction.delete({ where: { id } });
  } catch (err) {
    // Already gone (e.g. stale client state pointing at a deleted row) — treat as success.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }
  return NextResponse.json({ success: true });
}
