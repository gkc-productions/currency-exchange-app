import Link from "next/link";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { withLocale } from "@/src/lib/with-locale";

const SOCIAL_LINKS = [
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M14.86 3h3.48l-7.6 8.69L19 21h-6.5l-5.1-6.05L2.4 21H-1l8.1-9.26L1.2 3h6.7l4.6 5.47L14.86 3zm-1.22 15.2h1.93L8.1 5.62H6.07l7.57 12.58z"
        />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M4.98 3.5a2.48 2.48 0 110 4.96 2.48 2.48 0 010-4.96zM3 8.98h3.96V21H3V8.98zM9.04 8.98h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.09V21h-3.96v-5.46c0-1.3-.02-2.98-1.82-2.98-1.82 0-2.1 1.42-2.1 2.88V21H9.04V8.98z"
        />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.5 0-.25-.01-1.09-.02-1.98-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.12-1.52-1.12-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.02-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.3 9.3 0 015 0c1.9-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.02 1.63 1.02 2.75 0 3.94-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.5-.01 2.84 0 .28.18.61.69.5A10.2 10.2 0 0022 12.2C22 6.58 17.52 2 12 2z"
        />
      </svg>
    ),
  },
];

export default function Footer({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const year = new Date().getFullYear();

  const columns = [
    {
      title: messages.footerCompanyLabel,
      links: [
        { href: withLocale("/about", locale), label: messages.navAboutLabel },
        { href: withLocale("/security", locale), label: messages.navSecurityLabel },
      ],
    },
    {
      title: messages.footerProductLabel,
      links: [
        { href: withLocale("/fees", locale), label: messages.navFeesLabel },
        { href: `${withLocale("/", locale)}#send`, label: messages.footerSendLinkLabel },
      ],
    },
    {
      title: messages.footerResourcesLabel,
      links: [
        { href: withLocale("/help", locale), label: messages.navHelpLabel },
        { href: withLocale("/track", locale), label: "Track transfer" },
      ],
    },
    {
      title: messages.footerSupportLabel,
      links: [
        { href: withLocale("/help", locale), label: messages.footerContactLinkLabel },
        { href: withLocale("/help", locale), label: messages.footerStatusLinkLabel },
      ],
    },
  ];

  return (
    <footer className="border-t border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 lg:px-8 lg:grid-cols-[1.2fr_2.2fr]">
        <div className="flex max-w-xs flex-col gap-4">
          <div className="flex items-center">
            <img
              src="/brand/clarisend-logo-light.png"
              alt="ClariSend"
              className="block dark:hidden h-7 w-auto"
            />
            <img
              src="/brand/clarisend-logo-dark.png"
              alt="ClariSend"
              className="hidden dark:block h-7 w-auto"
            />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            Clarity in every transfer.
          </p>
          <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="rounded-full border border-neutral-200 bg-white p-2 transition hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                {link.icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © {year} GKC Financial Technologies
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
                {column.title}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-neutral-300 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
