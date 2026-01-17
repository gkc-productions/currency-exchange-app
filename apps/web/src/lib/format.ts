import type { Locale } from "@/src/lib/i18n/messages";

const resolveLocale = (locale: Locale) => (locale === "fr" ? "fr-FR" : "en-US");

export function formatMoney(
  amount: number,
  currencyCode: string,
  locale: Locale,
  decimals = 2
) {
  const localeTag = resolveLocale(locale);
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  try {
    return new Intl.NumberFormat(localeTag, options).format(amount);
  } catch {
    const fallback = new Intl.NumberFormat(localeTag, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
    return `${fallback} ${currencyCode}`;
  }
}

export function formatPercent(value: number, locale: Locale, digits = 2) {
  const localeTag = resolveLocale(locale);
  return new Intl.NumberFormat(localeTag, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

export function formatDateTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
