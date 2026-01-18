import { NextResponse } from "next/server";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";
import { isSameOrigin } from "@/src/lib/security";
import { executePayout } from "@/src/lib/rails";
import { logWarn } from "@/src/lib/logging";

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  if (!ALLOW_SIMULATED_PAYOUTS) {
    logWarn("mock_pay_blocked", {
      meta: { reason: "simulated_payouts_disabled" },
    });
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { error: "This action is only available from the ClariSend app." },
      { status: 403 }
    );
  }

  let payload: { transferId?: unknown };
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    payload = body as { transferId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transferId = readRequiredString(payload.transferId);
  if (!transferId) {
    return NextResponse.json({ error: "transferId is required" }, { status: 400 });
  }

  const result = await executePayout({ transferId });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Unable to execute payout." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, payout: result.payout });
}
