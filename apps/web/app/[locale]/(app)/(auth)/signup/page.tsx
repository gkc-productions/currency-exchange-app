"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AuthShell from "@/app/[locale]/(app)/_components/AuthShell";
import PasswordRulesPanel from "@/app/[locale]/(app)/_components/PasswordRulesPanel";
import { checkPasswordRules } from "@/src/lib/password-strength";

function mapSignupError(errorCode?: string): {
  form?: string;
  email?: string;
  password?: string;
} {
  switch (errorCode) {
    case "EMAIL_TAKEN":
      return { email: "This email is already in use. Try signing in." };
    case "WEAK_PASSWORD":
      return { password: "Use a stronger password that satisfies all requirements below." };
    case "INVALID_EMAIL":
      return { email: "Enter a valid email address." };
    case "CSRF_BLOCKED":
      return { form: "Request blocked. Refresh and try again." };
    default:
      return { form: "We couldn't create your account right now. Try again shortly." };
  }
}

export default function SignupPage() {
  const params = useParams();
  const locale = useMemo<"en" | "fr">(() => {
    const value = params?.locale;
    if (Array.isArray(value)) return value[0] === "fr" ? "fr" : "en";
    return value === "fr" ? "fr" : "en";
  }, [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const rules = checkPasswordRules(password, email);
  const isWeakPassword =
    !rules.lengthOk ||
    !rules.hasUpper ||
    !rules.hasLower ||
    !rules.hasNumber ||
    !rules.hasSymbol ||
    !rules.notCommon ||
    !rules.notEmailPart;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    setSuccess(null);

    if (isWeakPassword) {
      setPasswordError("Add missing password requirements before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; errorCode?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        const mapped = mapSignupError(payload?.errorCode);
        setFormError(mapped.form ?? null);
        setEmailError(mapped.email ?? null);
        setPasswordError(mapped.password ?? null);
        return;
      }

      setSuccess("Account created. Continue to sign in.");
    } catch {
      setFormError("We couldn't create your account right now. Try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      locale={locale}
      title="Create your account"
      subtitle="Set a strong password to keep your account secure."
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
          {emailError ? <span className="text-xs text-rose-600">{emailError}</span> : null}
        </label>

        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
          <span className="flex items-center justify-between">
            Password
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              placeholder="Create a strong password"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            Example strong password: <span className="font-medium text-slate-700">River-Glass!92</span>
          </span>
          {passwordError ? <span className="text-xs text-rose-600">{passwordError}</span> : null}
        </label>

        <PasswordRulesPanel password={password} email={email} />

        {isWeakPassword ? (
          <p className="text-xs text-amber-700">
            Follow the checklist above to strengthen your password.
          </p>
        ) : null}

        {formError ? <p className="text-xs text-rose-600">{formError}</p> : null}
        {success ? <p className="text-xs text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || isWeakPassword}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Already have an account?{" "}
        <Link href={`/${locale}/login`} className="font-medium text-slate-700 hover:text-slate-900">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
