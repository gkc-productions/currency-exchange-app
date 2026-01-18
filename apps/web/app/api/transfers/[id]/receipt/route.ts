import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { sendReceiptEmail } from "@/src/lib/email";

const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const transferId = resolvedParams.id?.trim();
  if (!transferId) {
    return NextResponse.json({ error: "Invalid transfer id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      quote: {
        include: {
          fromAsset: { select: { code: true } },
          toAsset: { select: { code: true } },
        },
      },
    },
  });

  if (!transfer || transfer.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transfer.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Receipt available after completion." },
      { status: 400 }
    );
  }

  if (transfer.receiptLastSentAt) {
    const elapsed = Date.now() - transfer.receiptLastSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  const receiptUrl = `${process.env.NEXTAUTH_URL ?? "https://app.clarisend.co"}/en/transfer/${transfer.id}`;

  await sendReceiptEmail({
    to: user.email,
    referenceCode: transfer.referenceCode,
    status: transfer.status,
    sendAmount: Number(transfer.quote.sendAmount),
    totalFee: Number(transfer.quote.totalFee),
    recipientGets: Number(transfer.quote.recipientGets),
    fromAsset: transfer.quote.fromAsset.code,
    toAsset: transfer.quote.toAsset.code,
    receiptUrl,
  });

  await prisma.transfer.update({
    where: { id: transfer.id },
    data: {
      receiptLastSentAt: new Date(),
      receiptSendCount: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true });
}
