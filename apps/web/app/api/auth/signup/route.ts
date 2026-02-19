import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin, jsonAuthError } from "@/src/lib/auth-http";
import { checkPasswordRules } from "@/src/lib/password-strength";
import { prisma } from "@/src/lib/prisma";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { getClientIp } from "@/src/lib/security";
import {
  createPasswordHash,
  getSessionCookieConfig,
  issueSession,
} from "@/src/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const csrfError = enforceBrowserSameOrigin(req);
  if (csrfError) {
    return csrfError;
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!isValidEmail(email)) {
    return jsonAuthError("INVALID_EMAIL", 400);
  }

  const rules = checkPasswordRules(password, email);
  if (
    !rules.lengthOk ||
    !rules.hasUpper ||
    !rules.hasLower ||
    !rules.hasNumber ||
    !rules.hasSymbol ||
    !rules.notCommon ||
    !rules.notEmailPart
  ) {
    return jsonAuthError("WEAK_PASSWORD", 400);
  }

  const ip = getClientIp(req);
  const rate = await enforceRateLimit({
    key: `signup:${ip}:${email}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return jsonAuthError("RATE_LIMITED", 429);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return jsonAuthError("EMAIL_TAKEN", 400);
  }

  const created = await prisma.user.create({
    data: {
      email,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: createPasswordHash(password),
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const session = await issueSession(created.id);
  const cookie = getSessionCookieConfig(process.env.NODE_ENV);
  const response = NextResponse.json(
    {
      ok: true,
      user: {
        id: created.id,
        email: created.email,
      },
    },
    { status: 201 },
  );
  response.cookies.set(cookie.name, session.rawToken, {
    ...cookie.options,
    expires: session.expires,
  });
  return response;
}
