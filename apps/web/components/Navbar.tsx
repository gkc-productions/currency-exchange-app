import Link from "next/link";
import LanguageSelect from "./LanguageSelect";
import AuthStatus from "./AuthStatus";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { withLocale } from "@/src/lib/with-locale";

export default function Navbar({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const navItems = [
    { href: withLocale("/about", locale), label: messages.navAboutLabel },
    { href: withLocale("/fees", locale), label: messages.navFeesLabel },
    { href: withLocale("/security", locale), label: messages.navSecurityLabel },
    { href: withLocale("/help", locale), label: messages.navHelpLabel },
    { href: withLocale("/track", locale), label: "Track" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={withLocale("/", locale)}
            className="flex items-center text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-label="ClariSend"
          >
            <picture>
              <source
                srcSet="/brand/clarisend-logo-dark.png"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="/brand/clarisend-logo-light.png"
                alt="ClariSend"
                className="h-6 w-auto sm:h-7 lg:h-8"
              />
            </picture>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`${withLocale("/", locale)}#send`}
            className="hidden items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:flex"
          >
            {messages.navGetStartedLabel}
          </Link>
          <AuthStatus locale={locale} />
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}
