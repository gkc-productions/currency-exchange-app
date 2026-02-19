"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShell from "@/app/[locale]/(app)/_components/AuthShell";

export default function LoginPage() {
  const params = useParams();
  const locale = useMemo<"en" | "fr">(() => {
    const value = params?.locale;
    if (Array.isArray(value)) return value[0] === "fr" ? "fr" : "en";
    return value === "fr" ? "fr" : "en";
  }, [params]);

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
        setError("Email or password is incorrect.");
        return;
      }

      setSent(true);
    } catch {
      setError("Email or password is incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      locale={locale}
      title="Sign in"
      subtitle="Use your email to access your dashboard."
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1 text-xs">We sent a secure sign-in link. It expires in 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              placeholder="you@example.com"
            />
          </label>
          <div className="flex items-center justify-between text-xs">
            <p className="text-slate-500">Secure sign-in • Rate limited • Optional 2-step verification</p>
            <Link href={`/${locale}/forgot`} className="font-medium text-slate-700 hover:text-slate-900">
              Forgot password?
            </Link>
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting || email.trim().length === 0}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href={`/${locale}/signup`} className="font-medium text-slate-700 hover:text-slate-900">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
