"use client";

import Link from "next/link";
import { signOutClient, useAuthSession } from "@/components/SessionProvider";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export default function AuthStatus({ locale }: { locale: Locale }) {
  const { data: session, status } = useAuthSession();
  const messages = getMessages(locale);

  if (status === "loading") {
    return (
      <span className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
        ...
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700"
      >
        {messages.navSignInLabel}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/${locale}/dashboard`}
        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700"
      >
        {messages.navDashboardLabel}
      </Link>
      <button
        type="button"
        onClick={() => {
          void signOutClient(locale);
        }}
        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700"
      >
        {messages.navSignOutLabel}
      </button>
    </div>
  );
}
