"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/app/[locale]/(app)/_components/AuthShell";

function mapLoginError(errorCode?: string) {
  if (!errorCode) {
    return "Email or password is incorrect.";
  }
  if (errorCode.includes("RATE_LIMITED")) {
    return "Too many attempts. Try again in a few minutes.";
  }
  if (errorCode.includes("LOCKED")) {
    return "Account temporarily locked. Try again later.";
  }
  if (errorCode.includes("CSRF_BLOCKED")) {
    return "Request blocked. Refresh and try again.";
  }
  return "Email or password is incorrect.";
}

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useMemo<"en" | "fr">(() => {
    const value = params?.locale;
    if (Array.isArray(value)) return value[0] === "fr" ? "fr" : "en";
    return value === "fr" ? "fr" : "en";
  }, [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; errorCode?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        setError(mapLoginError(payload?.errorCode));
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : `/${locale}/dashboard`);
    } catch {
      setError(mapLoginError());
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
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            placeholder="Your password"
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
          disabled={isSubmitting || email.trim().length === 0 || password.length === 0}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href={`/${locale}/signup`} className="font-medium text-slate-700 hover:text-slate-900">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
