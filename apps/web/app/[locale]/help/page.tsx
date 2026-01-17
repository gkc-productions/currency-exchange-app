import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";

export default function HelpPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Support",
          title: "Nous sommes la pour aider",
          subtitle:
            "Consultez nos ressources ou contactez l'equipe ClariSend pour obtenir de l'aide.",
          points: [
            "Centre d'aide disponible 24/7 pour les questions de transferts.",
            "Statuts en direct et confirmations envoyees automatiquement.",
            "Support prioritaire pour les corridors critiques.",
          ],
          cta: "Retour a l'accueil",
        }
      : {
          eyebrow: "Support",
          title: "We are here to help",
          subtitle:
            "Check our resources or reach the ClariSend team for assistance.",
          points: [
            "24/7 help center coverage for transfer questions.",
            "Live status updates and automated confirmations.",
            "Priority support for critical corridors.",
          ],
          cta: "Back to home",
        };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
        {content.eyebrow}
      </p>
      <h1 className="mt-3 font-[var(--font-display)] text-4xl text-slate-900">
        {content.title}
      </h1>
      <p className="mt-4 text-lg text-slate-600">{content.subtitle}</p>
      <div className="mt-8 grid gap-3">
        {content.points.map((point) => (
          <div
            key={point}
            className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-700"
          >
            {point}
          </div>
        ))}
      </div>
      <Link
        href={`/${locale}`}
        className="mt-10 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        {content.cta}
      </Link>
    </div>
  );
}
