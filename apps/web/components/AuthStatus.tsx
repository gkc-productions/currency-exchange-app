"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export default function AuthStatus({ locale }: { locale: Locale }) {
  const { data: session, status } = useSession();
  const messages = getMessages(locale);

  if (status === "loading") {
    return (
      <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400">
        ...
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
      >
        {messages.navSignInLabel}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/${locale}/dashboard`}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
      >
        {messages.navDashboardLabel}
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${locale}` })}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
      >
        {messages.navSignOutLabel}
      </button>
    </div>
  );
}
