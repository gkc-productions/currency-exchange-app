import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
const DEFAULT_LOCALE = "en";
const PUBLIC_FILE = /\.(.*)$/;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) {
    const incomingId = req.headers.get("x-request-id");
    const requestId = incomingId || createRequestId();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    console.info(`[api] ${requestId} ${req.method} ${req.nextUrl.pathname}`);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
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
    return NextResponse.redirect(url);
  }

  const locale = pathname.split("/")[1] ?? DEFAULT_LOCALE;
  const response = NextResponse.next();
  if (SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    response.cookies.set("locale", locale, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PRODUCTION,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
