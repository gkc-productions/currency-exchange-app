"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

const LOCALE_PATTERN = /^\/(en|fr)(?=\/|$)/;

const LANGUAGE_OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
];

export default function LanguageSelect() {
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={messages.languageToggleLabel}
      >
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{messages.languageToggleLabel}</span>
        <span>{locale === "fr" ? messages.languageFrLabel : messages.languageEnLabel}</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                role="menuitem"
                onClick={() => handleSwitch(option.code)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                    : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                <span>{option.label}</span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {option.code.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
