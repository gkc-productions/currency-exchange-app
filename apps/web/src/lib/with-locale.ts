import type { Locale } from "@/src/lib/i18n/messages";

export function withLocale(path: string, locale: Locale) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}
