"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AuthShell from "@/app/[locale]/(app)/_components/AuthShell";

export default function ForgotPage() {
  const params = useParams();
  const locale = useMemo<"en" | "fr">(() => {
    const value = params?.locale;
    if (Array.isArray(value)) return value[0] === "fr" ? "fr" : "en";
    return value === "fr" ? "fr" : "en";
  }, [params]);

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Preserve generic success copy.
    } finally {
      setMessage("If an account exists for this email, we sent reset instructions.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      locale={locale}
      title="Forgot password"
      subtitle="We will email reset instructions if your account exists."
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

        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || email.trim().length === 0}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
