import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  locale,
  title,
  subtitle,
  children,
}: {
  locale: "en" | "fr";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const trustPoints = [
    "Secure sign-in",
    "Optional 2-step verification",
    "Audit-logged activity",
  ];

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#e5f8ef_0%,_#eff6ff_55%,_#ffffff_100%)] px-6 py-16 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute -left-10 top-10 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            ClariSend Access
          </p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl text-slate-900">
            Sign in with confidence
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Secure sign-in • Optional 2-step verification • Audit-logged activity
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Strong password sample: <span className="font-medium text-slate-800">River-Glass!92</span>
          </div>
        </aside>

        <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-base font-semibold text-emerald-700">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">ClariSend</p>
              <p className="text-xs text-slate-500">Secure sign-in, audit logged</p>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            What you can do today: get quotes, build recipients, track transfers, save receipts.
          </div>

          <div className="mt-6">{children}</div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <Link href={`/${locale}`} className="transition hover:text-slate-700">
              Back to site
            </Link>
            <Link href={`/${locale}/help`} className="transition hover:text-slate-700">
              Help
            </Link>
            <Link href={`/${locale}/security`} className="transition hover:text-slate-700">
              Security
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
