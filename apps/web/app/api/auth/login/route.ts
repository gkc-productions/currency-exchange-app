import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin, jsonAuthError } from "@/src/lib/auth-http";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { getClientIp } from "@/src/lib/security";
import {
  findCredentialsAccountByEmail,
  getSessionCookieConfig,
  issueSession,
  verifyPassword,
} from "@/src/lib/auth";

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

  if (!email || !password) {
    return jsonAuthError("INVALID_CREDENTIALS", 401);
  }

  const ip = getClientIp(req);
  const rate = await enforceRateLimit({
    key: `login:${ip}:${email}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return jsonAuthError("RATE_LIMITED", 429);
  }

  const account = await findCredentialsAccountByEmail(email);
  if (!account?.access_token || !account.user?.email) {
    return jsonAuthError("INVALID_CREDENTIALS", 401);
  }

  const isValid = verifyPassword(password, account.access_token);
  if (!isValid) {
    return jsonAuthError("INVALID_CREDENTIALS", 401);
  }

  const session = await issueSession(account.userId);
  const cookie = getSessionCookieConfig(process.env.NODE_ENV);
  const response = NextResponse.json({
    ok: true,
    session: {
      user: {
        id: account.user.id,
        email: account.user.email,
      },
      expires: session.expires.toISOString(),
    },
  });
  response.cookies.set(cookie.name, session.rawToken, {
    ...cookie.options,
    expires: session.expires,
  });
  return response;
}
