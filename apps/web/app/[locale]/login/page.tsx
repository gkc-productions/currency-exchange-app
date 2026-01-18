"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export default function LoginPage() {
  const params = useParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: `/${locale}/dashboard`,
        redirect: false,
      });

      if (result?.error) {
        setError(messages.loginError);
        return;
      }

      setSent(true);
    } catch {
      setError(messages.loginError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.45)]">
        <h1 className="text-2xl font-semibold text-slate-900">
          {messages.loginTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {messages.loginSubtitle}
        </p>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <p className="font-semibold">{messages.loginSentTitle}</p>
            <p className="mt-1 text-xs text-emerald-700">
              {messages.loginSentDescription}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {messages.loginEmailLabel}
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={messages.loginEmailPlaceholder}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              />
            </label>
            {error ? (
              <p className="text-xs text-rose-600">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting || email.trim().length === 0}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSubmitting ? messages.loginButton : messages.loginButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
