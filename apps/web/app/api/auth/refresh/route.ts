import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin, jsonAuthError } from "@/src/lib/auth-http";
import { AUTH_SESSION_COOKIE } from "@/src/lib/auth-constants";
import { getSessionCookieConfig, rotateSession } from "@/src/lib/auth";

export async function POST(req: Request) {
  const csrfError = enforceBrowserSameOrigin(req);
  if (csrfError) {
    return csrfError;
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!token) {
    return jsonAuthError("UNAUTHORIZED", 401);
  }

  const rotated = await rotateSession(decodeURIComponent(token));
  if (!rotated) {
    return jsonAuthError("UNAUTHORIZED", 401);
  }

  const cookie = getSessionCookieConfig(process.env.NODE_ENV);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, rotated.rawToken, {
    ...cookie.options,
    expires: rotated.expires,
  });
  return response;
}
