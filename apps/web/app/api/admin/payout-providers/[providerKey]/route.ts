import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getReadOnlyResponse, readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: { providerKey: string } | Promise<{ providerKey: string }> }
) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const readOnly = getReadOnlyResponse(req, { isAdmin: true });
  if (readOnly) {
    return readOnly;
  }

  const resolvedParams = await Promise.resolve(params);
  const providerKey = resolvedParams.providerKey?.trim();
  if (!providerKey) {
    return NextResponse.json({ error: "Invalid provider key" }, { status: 400 });
  }

  let payload: { isEnabled?: unknown; isHealthy?: unknown; note?: unknown };
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    payload = body as { isEnabled?: unknown; isHealthy?: unknown; note?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isEnabled = readBoolean(payload.isEnabled);
  const isHealthy = readBoolean(payload.isHealthy);
  const update: {
    isEnabled?: boolean;
    isHealthy?: boolean;
    lastCheckedAt?: Date;
  } = {};
  if (isEnabled !== null) {
    update.isEnabled = isEnabled;
  }
  if (isHealthy !== null) {
    update.isHealthy = isHealthy;
    update.lastCheckedAt = new Date();
  }

  const state = await prisma.payoutProviderState.upsert({
    where: { providerKey },
    update,
    create: {
      providerKey,
      ...(isEnabled !== null ? { isEnabled } : {}),
      ...(isHealthy !== null ? { isHealthy, lastCheckedAt: new Date() } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: session?.user?.email ?? "system",
      action: "PAYOUT_PROVIDER_UPDATED",
      entityType: "PayoutProviderState",
      entityId: state.providerKey,
      metadata: {
        isEnabled: state.isEnabled,
        isHealthy: state.isHealthy,
        note: typeof payload.note === "string" ? payload.note : null,
      },
    },
  });

  return NextResponse.json({
    providerKey: state.providerKey,
    isEnabled: state.isEnabled,
    isHealthy: state.isHealthy,
    lastCheckedAt: state.lastCheckedAt,
    lastErrorAt: state.lastErrorAt,
    lastErrorCode: state.lastErrorCode,
    lastErrorMessage: state.lastErrorMessage,
  });
}
