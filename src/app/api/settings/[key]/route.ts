import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const setting = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ value: setting?.value ?? null });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await req.json();
  const setting = await prisma.setting.upsert({
    where: { key },
    create: { key, value: body.value },
    update: { value: body.value },
  });
  return NextResponse.json({ value: setting.value });
}
