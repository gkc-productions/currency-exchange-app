import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "fr"];
const DEFAULT_LOCALE = "en";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If already has a locale, continue
  const hasLocale = SUPPORTED_LOCALES.some((locale) =>
    pathname.startsWith(`/${locale}`)
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // Get locale from cookie or accept-language header
  const cookieLocale = req.cookies.get("locale")?.value;
  const acceptLanguage = req.headers.get("accept-language");
  const preferredLocale =
    acceptLanguage?.split(",")[0]?.split("-")[0]?.toLowerCase();

  let locale = DEFAULT_LOCALE;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  } else if (preferredLocale && SUPPORTED_LOCALES.includes(preferredLocale)) {
    locale = preferredLocale;
  }

  // Redirect to localized path
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set("locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 31536000, // 1 year
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
