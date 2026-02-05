import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { readDevBypassEmail } from "@/src/lib/security";

type SessionLike = { user?: { email?: string | null } | null } | null;

function readDevBypassSession(req: Request): SessionLike {
  const email = readDevBypassEmail(req);
  if (!email) {
    return null;
  }
  console.info("dev_auth_bypass_used");
  return { user: { email } };
}

export async function GET(req: Request) {
  const session = readDevBypassSession(req) ?? (await getServerAuthSession());
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const providers = await prisma.payoutProviderState.findMany({
    orderBy: { providerKey: "asc" },
  });

  return NextResponse.json(
    providers.map((provider) => ({
      providerKey: provider.providerKey,
      isEnabled: provider.isEnabled,
      isHealthy: provider.isHealthy,
      lastCheckedAt: provider.lastCheckedAt,
      lastErrorAt: provider.lastErrorAt,
      lastErrorCode: provider.lastErrorCode,
      lastErrorMessage: provider.lastErrorMessage,
    }))
  );
}
