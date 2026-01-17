export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      title: "Transparent Pricing",
      subtitle: "Know exactly what you're paying, every time",
      intro: {
        title: "No Hidden Fees",
        description:
          "With ClariSend, you see the full cost breakdown before you send. We believe in complete transparency because your money deserves clarity.",
      },
      breakdown: {
        title: "How Our Pricing Works",
        items: [
          {
            title: "Transfer Fee",
            description:
              "A small fixed fee plus a percentage of your send amount. This varies by route and payout method.",
          },
          {
            title: "Exchange Rate Margin",
            description:
              "A transparent markup on the mid-market exchange rate. Typically 1-2%, always displayed upfront.",
          },
          {
            title: "No Surprise Charges",
            description:
              "What you see is what you pay. No hidden fees, no fine print, no surprises at any stage of your transfer.",
          },
        ],
      },
      compare: {
        title: "Always Get the Best Deal",
        description:
          "We show you multiple routes for every transfer. Compare fees, exchange rates, and delivery times to choose what works best for you.",
        features: [
          "Lowest Fee option highlighted",
          "Fastest delivery option shown",
          "Best value for recipient displayed",
          "Real-time rate updates",
        ],
      },
      cta: "See Live Rates Now",
    },
    fr: {
      title: "Tarification transparente",
      subtitle: "Sachez exactement ce que vous payez, à chaque fois",
      intro: {
        title: "Aucun frais caché",
        description:
          "Avec ClariSend, vous voyez la répartition complète des coûts avant d'envoyer. Nous croyons en la transparence totale.",
      },
      breakdown: {
        title: "Comment fonctionne notre tarification",
        items: [
          {
            title: "Frais de transfert",
            description:
              "Un petit frais fixe plus un pourcentage de votre montant envoyé. Cela varie selon la route et la méthode de paiement.",
          },
          {
            title: "Marge de taux de change",
            description:
              "Une majoration transparente sur le taux de change du marché moyen. Généralement 1-2%, toujours affiché à l'avance.",
          },
          {
            title: "Aucun frais surprise",
            description:
              "Ce que vous voyez est ce que vous payez. Pas de frais cachés, pas de petits caractères, pas de surprises.",
          },
        ],
      },
      compare: {
        title: "Obtenez toujours la meilleure offre",
        description:
          "Nous vous montrons plusieurs routes pour chaque transfert. Comparez les frais, les taux de change et les délais de livraison.",
        features: [
          "Option de frais les plus bas mise en évidence",
          "Option de livraison la plus rapide affichée",
          "Meilleure valeur pour le destinataire affichée",
          "Mises à jour des taux en temps réel",
        ],
      },
      cta: "Voir les taux en direct",
    },
  };

  const t = messages[validLocale];

  return (
    <div className="py-20 bg-[var(--brand-surface)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">{t.title}</h1>
          <p className="text-xl text-slate-600">{t.subtitle}</p>
        </div>

        {/* Intro */}
        <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.intro.title}
          </h2>
          <p className="text-lg text-slate-600">{t.intro.description}</p>
        </div>

        {/* Pricing Breakdown */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {t.breakdown.title}
          </h2>
          <div className="space-y-6">
            {t.breakdown.items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compare Routes */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.compare.title}
          </h2>
          <p className="text-lg text-slate-600 mb-6">{t.compare.description}</p>
          <ul className="space-y-3">
            {t.compare.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://app.clarisend.co"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-lg shadow-lg"
          >
            {t.cta}
          </a>
        </div>
      </div>
    </div>
  );
}
