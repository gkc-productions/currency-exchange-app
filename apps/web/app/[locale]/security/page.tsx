import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";

export default function SecurityPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Sécurité",
          title: "Protection et conformité",
          subtitle:
            "ClariSend applique des contrôles stricts pour protéger vos transferts et vos données.",
          points: [
            "Chiffrement des données en transit et au repos.",
            "Contrôles KYC/AML adaptés aux corridors pris en charge.",
            "Surveillance continue des risques et auditabilité.",
          ],
          cta: "Voir l'aide",
        }
      : {
          eyebrow: "Security",
          title: "Protection and compliance",
          subtitle:
            "ClariSend applies strict controls to protect your transfers and data.",
          points: [
            "Data encryption in transit and at rest.",
            "KYC/AML controls tailored to supported corridors.",
            "Continuous risk monitoring and auditability.",
          ],
          cta: "Visit help",
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
        href={`/${locale}/help`}
        className="mt-10 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        {content.cta}
      </Link>
    </div>
  );
}
