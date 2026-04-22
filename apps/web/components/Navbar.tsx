import Link from "next/link";
import LanguageSelect from "./LanguageSelect";
import AuthStatus from "./AuthStatus";
import ThemeToggle from "./ThemeToggle";
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
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={withLocale("/", locale)}
            className="flex items-center text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-neutral-100"
            aria-label="ClariSend"
          >
            <img
              src="/brand/clarisend-logo-light.png"
              alt="ClariSend"
              className="block h-7 w-auto dark:hidden"
            />
            <img
              src="/brand/clarisend-logo-dark.png"
              alt="ClariSend"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`${withLocale("/", locale)}#send`}
            className="hidden items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:flex"
          >
            {messages.navGetStartedLabel}
          </Link>
          <ThemeToggle />
          <AuthStatus locale={locale} />
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}
