import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";

export default function FeesPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Frais",
          title: "Tarification transparente",
          subtitle:
            "ClariSend affiche clairement le taux, la marge FX et les frais avant toute validation.",
          points: [
            "Taux du marché et taux appliqué visibles avant verrouillage.",
            "Frais fixes et en pourcentage affichés séparément.",
            "Aucun frais caché au moment du paiement.",
          ],
          cta: "Démarrer un devis",
        }
      : {
          eyebrow: "Fees",
          title: "Transparent pricing",
          subtitle:
            "ClariSend shows the live rate, FX margin, and fees before you confirm.",
          points: [
            "Market rate and applied rate visible before you lock.",
            "Fixed and percentage fees listed separately.",
            "No hidden charges at payout.",
          ],
          cta: "Start a quote",
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
        href={`/${locale}#send`}
        className="mt-10 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        {content.cta}
      </Link>
    </div>
  );
}
