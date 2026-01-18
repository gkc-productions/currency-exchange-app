import Link from "next/link";
import LanguageSelect from "./LanguageSelect";
import AuthStatus from "./AuthStatus";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export default function Navbar({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const navItems = [
    { href: `/${locale}/about`, label: messages.navAboutLabel },
    { href: `/${locale}/fees`, label: messages.navFeesLabel },
    { href: `/${locale}/security`, label: messages.navSecurityLabel },
    { href: `/${locale}/help`, label: messages.navHelpLabel },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-label="ClariSend"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-700 shadow-sm">
              C
            </span>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight">ClariSend</span>
              <span className="text-xs text-slate-500">
                {messages.tagline}
              </span>
            </div>
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
            href={`/${locale}#send`}
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
