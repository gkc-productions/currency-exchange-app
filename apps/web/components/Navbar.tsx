import Link from "next/link";
import LanguageSelect from "./LanguageSelect";
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
    <header className="sticky top-0 z-40 border-b border-brand-border/70 bg-brand-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
            aria-label="ClariSend"
          >
            <img
              src="/brand/clarisend-mark.svg"
              alt=""
              className="h-10 w-10 sm:hidden"
              aria-hidden="true"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <img
                src="/brand/clarisend-logo-full.svg"
                alt=""
                className="h-8 w-auto"
                aria-hidden="true"
              />
              <span className="text-xs uppercase tracking-[0.24em] text-brand-muted">
                {messages.tagline}
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-brand-muted md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}#send`}
            className="hidden items-center justify-center rounded-full bg-brand-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-sm transition hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 sm:flex"
          >
            {messages.navGetStartedLabel}
          </Link>
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}
