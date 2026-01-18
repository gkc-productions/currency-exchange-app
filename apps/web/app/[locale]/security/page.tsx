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
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-emerald-700">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-slate-900 sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{content.subtitle}</p>
      </div>
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
        className="mt-10 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        {content.cta}
      </Link>
    </div>
  );
}
