import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins() {
  if (DEFAULT_ALLOWED_ORIGINS.size === 0) {
    const envOrigin = process.env.NEXTAUTH_URL;
    if (envOrigin) {
      DEFAULT_ALLOWED_ORIGINS.add(envOrigin);
    }
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

export function isDevBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "1";
}

export function isDevBypassRequest(req: Request) {
  return isDevBypassEnabled() && req.headers.get("x-dev-bypass-auth") === "1";
}

export function readDevBypassEmail(req: Request) {
  if (!isDevBypassRequest(req)) {
    return null;
  }
  const email = req.headers.get("x-dev-user-email")?.trim() ?? "";
  if (!email || !email.includes("@")) {
    return null;
  }
  return email;
}

export function getReadOnlyResponse(req: Request, options?: { isAdmin?: boolean }) {
  if (process.env.APP_READ_ONLY !== "1") {
    return null;
  }
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }
  if (process.env.NODE_ENV !== "production" && options?.isAdmin) {
    return null;
  }
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const path = new URL(req.url).pathname;
  console.info(`read_only_blocked method=${method} path=${path} requestId=${requestId}`);
  return NextResponse.json({ error: "read_only_mode" }, { status: 503 });
}

if (typeof window === "undefined") {
  const globalAny = globalThis as { __runtimeInfoLogged?: boolean };
  if (!globalAny.__runtimeInfoLogged) {
    globalAny.__runtimeInfoLogged = true;
    const commit =
      process.env.GIT_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      "unknown";
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "null";
    const nodeEnv = process.env.NODE_ENV ?? "unknown";
    const devBypass = isDevBypassEnabled();
    console.info(
      `runtime_info nodeEnv=${nodeEnv} devBypass=${devBypass} baseUrl=${baseUrl} commit=${commit}`
    );
  }
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function isSameOrigin(req: Request) {
  if (isDevBypassRequest(req)) {
    return true;
  }

  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();
  const requestUrl = new URL(req.url);
  const requestOrigin = requestUrl.origin;
  const allowedOrigins = getAllowedOrigins();

  const originToCheck = origin ?? (referer ? new URL(referer).origin : null);
  if (!originToCheck) {
    return false;
  }

  if (originToCheck === requestOrigin) {
    return true;
  }

  if (allowedOrigins.has(originToCheck)) {
    return true;
  }

  return false;
}
