"use client";

import { useMemo } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

const LOCALE_PATTERN = /^\/(en|fr)(?=\/|$)/;

export default function LocaleToggle() {
  const params = useParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const buildHref = (target: Locale) => {
    const nextPath = LOCALE_PATTERN.test(pathname)
      ? pathname.replace(LOCALE_PATTERN, `/${target}`)
      : `/${target}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    const query = searchParams?.toString();
    return query ? `${nextPath}?${query}` : nextPath;
  };

  const handleSwitch = (target: Locale) => {
    const href = buildHref(target);
    document.cookie = `locale=${target}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(href);
  };

  const baseButton =
    "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] transition";

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 px-1 py-1 text-slate-700 shadow-sm backdrop-blur"
      aria-label={messages.languageToggleLabel}
    >
      <button
        type="button"
        onClick={() => handleSwitch("en")}
        className={`${baseButton} ${locale === "en" ? "bg-slate-900 text-white" : "hover:text-slate-900"}`}
        aria-pressed={locale === "en"}
      >
        {messages.languageEnLabel}
      </button>
      <button
        type="button"
        onClick={() => handleSwitch("fr")}
        className={`${baseButton} ${locale === "fr" ? "bg-slate-900 text-white" : "hover:text-slate-900"}`}
        aria-pressed={locale === "fr"}
      >
        {messages.languageFrLabel}
      </button>
    </div>
  );
}
