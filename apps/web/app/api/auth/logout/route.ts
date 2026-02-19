import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin } from "@/src/lib/auth-http";
import { AUTH_SESSION_COOKIE } from "@/src/lib/auth-constants";
import { revokeSession } from "@/src/lib/auth";

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

  if (token) {
    await revokeSession(decodeURIComponent(token));
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
