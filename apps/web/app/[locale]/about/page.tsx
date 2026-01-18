import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "ClariSend",
          title: "Qui nous sommes",
          subtitle:
            "ClariSend est le produit de GKC Financial Technologies, construit pour rendre les envois internationaux plus clairs.",
          missionTitle: "Notre mission",
          missionBody:
            "Offrir des paiements transparents, avec des taux clairs, des frais visibles et des délais prévisibles.",
          valuesTitle: "Ce qui nous guide",
          valuesBody:
            "Clarté, conformité et performance pour chaque transfert, dans chaque corridor.",
          cta: "Découvrir les tarifs",
        }
      : {
          eyebrow: "ClariSend",
          title: "Who we are",
          subtitle:
            "ClariSend is the product of GKC Financial Technologies, built to make global transfers clearer.",
          missionTitle: "Our mission",
          missionBody:
            "Deliver transparent payments with clear rates, visible fees, and predictable delivery.",
          valuesTitle: "What guides us",
          valuesBody:
            "Clarity, compliance, and performance for every transfer in every corridor.",
          cta: "Explore fees",
        };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-emerald-700">{content.eyebrow}</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-slate-900 sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{content.subtitle}</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">
            {content.missionTitle}
          </p>
          <p className="mt-2 text-sm text-slate-600">{content.missionBody}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">
            {content.valuesTitle}
          </p>
          <p className="mt-2 text-sm text-slate-600">{content.valuesBody}</p>
        </div>
      </div>
      <Link
        href={`/${locale}/fees`}
        className="mt-10 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        {content.cta}
      </Link>
    </div>
  );
}
