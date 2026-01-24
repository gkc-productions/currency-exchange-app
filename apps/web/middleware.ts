import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
const DEFAULT_LOCALE = "en";
const PUBLIC_FILE = /\.(.*)$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 40;
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();
const rateLimitPaths = [
  "/api/quote",
  "/api/recommendation",
  "/api/recommendations",
  "/api/transfers",
];

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-dns-prefetch-control", "off");
  return response;
}

function isRateLimited(pathname: string) {
  return rateLimitPaths.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) {
    const limitedPath = isRateLimited(pathname);
    if (limitedPath) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const clientIp =
        (req as { ip?: string }).ip ??
        forwardedFor?.split(",")[0]?.trim() ??
        "unknown";
      const key = `${clientIp}:${limitedPath}`;
      const now = Date.now();
      const entry = rateLimitStore.get(key);
      if (!entry || entry.resetAt <= now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else {
        entry.count += 1;
        if (entry.count > RATE_LIMIT_MAX) {
          const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
          const limitedResponse = NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 }
          );
          limitedResponse.headers.set("retry-after", retryAfter.toString());
          return applySecurityHeaders(limitedResponse);
        }
      }
    }

    const incomingId = req.headers.get("x-request-id");
    const requestId = incomingId || createRequestId();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    console.info(`[api] ${requestId} ${req.method} ${req.nextUrl.pathname}`);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return applySecurityHeaders(response);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale) {
    const preferred = req.cookies.get("locale")?.value;
    const locale = SUPPORTED_LOCALES.includes(
      preferred as (typeof SUPPORTED_LOCALES)[number]
    )
      ? preferred
      : DEFAULT_LOCALE;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const locale = pathname.split("/")[1] ?? DEFAULT_LOCALE;
  const response = NextResponse.next();
  if (SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    response.cookies.set("locale", locale, { path: "/", sameSite: "lax" });
  }
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
