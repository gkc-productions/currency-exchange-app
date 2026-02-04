import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Quote expired", errorCode: "QUOTE_EXPIRED" },
      { status: 400 }
    );
  }

  const existingLock = await prisma.auditLog.findFirst({
    where: { action: "QUOTE_LOCKED", entityType: "Quote", entityId: quote.id },
    orderBy: { createdAt: "desc" },
  });

  if (!existingLock) {
    await prisma.auditLog.create({
      data: {
        actor: "system",
        action: "QUOTE_LOCKED",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          lockedAt: new Date().toISOString(),
        },
      },
    });
  }

  return NextResponse.json({ id: quote.id });
}
