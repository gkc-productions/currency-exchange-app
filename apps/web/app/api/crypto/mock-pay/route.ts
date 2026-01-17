import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getMessages } from "@/src/lib/i18n/messages";

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const devEndpointsDisabled =
  process.env.NODE_ENV === "production" ||
  process.env.DISABLE_DEV_ENDPOINTS === "true";

const payoutTransitions: Record<string, Set<string>> = {
  CREATED: new Set(["REQUESTED", "EXPIRED", "FAILED"]),
  REQUESTED: new Set(["PAID", "EXPIRED", "FAILED"]),
};

export async function POST(req: Request) {
  if (devEndpointsDisabled) {
    console.warn("[crypto] mock-pay blocked in production/dev-disabled mode");
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let payload: { transferId?: unknown };
  try {
    payload = (await req.json()) as { transferId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transferId = readRequiredString(payload.transferId);
  if (!transferId) {
    return NextResponse.json({ error: "transferId is required" }, { status: 400 });
  }

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { cryptoPayout: true },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (transfer.payoutRail !== "LIGHTNING" || !transfer.cryptoPayout) {
    return NextResponse.json(
      { error: "No Lightning payout available" },
      { status: 409 }
    );
  }

  if (
    transfer.cryptoPayout.status === "PAID" ||
    transfer.cryptoPayout.status === "EXPIRED" ||
    transfer.cryptoPayout.status === "FAILED"
  ) {
    return NextResponse.json(
      { error: "Lightning payout cannot be paid" },
      { status: 409 }
    );
  }

  const payoutAllowed = payoutTransitions[transfer.cryptoPayout.status];
  if (!payoutAllowed || !payoutAllowed.has("PAID")) {
    return NextResponse.json(
      { error: "Lightning payout not ready for payment" },
      { status: 409 }
    );
  }

  if (transfer.status !== "READY" && transfer.status !== "PROCESSING") {
    return NextResponse.json(
      { error: "Invalid status transition" },
      { status: 409 }
    );
  }

  const messages = getMessages("en");

  try {
    await prisma.$transaction([
      prisma.cryptoPayout.update({
        where: { id: transfer.cryptoPayout.id },
        data: { status: "PAID" },
      }),
      prisma.transfer.update({
        where: { id: transferId },
        data: { status: "COMPLETED" },
      }),
      prisma.transferEvent.create({
        data: {
          transferId,
          type: "PAID",
          message: messages.transferPaidEvent,
        },
      }),
      prisma.transferEvent.create({
        data: {
          transferId,
          type: "COMPLETED",
          message: messages.transferCompletedEvent,
        },
      }),
    ]);
  } catch {
    return NextResponse.json(
      { error: messages.transferUpdateError },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
