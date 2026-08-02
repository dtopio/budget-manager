import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryUpdateSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }
  return NextResponse.json({ success: true });
}
