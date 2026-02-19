"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AuthShell from "@/app/[locale]/(app)/_components/AuthShell";
import PasswordRulesPanel from "@/app/[locale]/(app)/_components/PasswordRulesPanel";

export default function ResetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useMemo<"en" | "fr">(() => {
    const value = params?.locale;
    if (Array.isArray(value)) return value[0] === "fr" ? "fr" : "en";
    return value === "fr" ? "fr" : "en";
  }, [params]);

  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        setError("Reset link is invalid or expired. Request a new one.");
        return;
      }

      setMessage("Password updated. You can sign in now.");
    } catch {
      setError("Reset link is invalid or expired. Request a new one.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      locale={locale}
      title="Reset password"
      subtitle="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
          New password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            placeholder="Create a strong password"
          />
        </label>

        <PasswordRulesPanel password={password} email="" />

        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || token.length === 0}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
