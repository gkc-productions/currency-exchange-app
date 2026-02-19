import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logInfo } from "@/src/lib/logging";
import { AUTH_SESSION_COOKIE } from "@/src/lib/auth-constants";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
const DEFAULT_LOCALE = "en";
const PUBLIC_FILE = /\.(.*)$/;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PROTECTED_PREFIXES = ["/app", "/dashboard", "/transfer", "/transfers", "/recipients", "/admin"];
const ADMIN_PREFIX = "/admin";
const CANONICAL_HOST = "clarisend.co";
const WWW_HOST = "www.clarisend.co";

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchSessionRole(req: NextRequest): Promise<"USER" | "ADMIN" | null> {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  try {
    const sessionUrl = req.nextUrl.clone();
    sessionUrl.pathname = "/api/auth/session";
    sessionUrl.search = "";

    const response = await fetch(sessionUrl, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json().catch(() => null)) as
      | { session?: { user?: { role?: unknown } | null } | null }
      | null;
    const role = body?.session?.user?.role;
    if (role === "ADMIN" || role === "USER") {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

function isAdminLocalePath(localePathname: string) {
  return localePathname === ADMIN_PREFIX || localePathname.startsWith(`${ADMIN_PREFIX}/`);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (host === WWW_HOST) {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 301);
  }

  if (pathname.startsWith("/api")) {
    const incomingId = req.headers.get("x-request-id");
    const requestId = incomingId || createRequestId();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    logInfo("api_request", {
      requestId,
      route: req.nextUrl.pathname,
      meta: { method: req.method },
    });

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
  const localePrefix = `/${locale}`;
  const localePathname = pathname === localePrefix ? "/" : pathname.slice(localePrefix.length);
  if (isMarketingLocalePath(localePathname)) {
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
  const isProtected = isProtectedLocalePath(localePathname);

  if (isProtected) {
    const hasSessionCookie = Boolean(req.cookies.get(AUTH_SESSION_COOKIE)?.value);
    if (!hasSessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
      return NextResponse.redirect(url);
    }

    if (isAdminLocalePath(localePathname)) {
      const role = await fetchSessionRole(req);
      if (role !== "ADMIN") {
        if (localePathname !== "/admin") {
          const url = req.nextUrl.clone();
          url.pathname = `/${locale}/admin`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

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

export function isProtectedLocalePath(localePathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => localePathname === prefix || localePathname.startsWith(`${prefix}/`)
  );
}

export function isMarketingLocalePath(localePathname: string) {
  return !isProtectedLocalePath(localePathname);
}
