import type { Metadata } from "next";
import TrackedLink from "@/components/TrackedLink";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const metadataByLocale = {
    en: {
      title: "Transparent pricing, always upfront",
      description:
        "See transfer fees, exchange rate margins, and total payout before you send money internationally.",
      path: "/en/pricing",
    },
    fr: {
      title: "Tarifs transparents, toujours clairs",
      description:
        "Consultez les frais, la marge de change et le montant final avant chaque envoi international.",
      path: "/fr/pricing",
    },
  } as const;

  const metadata = metadataByLocale[validLocale];

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.path,
      languages: {
        en: "/en/pricing",
        fr: "/fr/pricing",
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `https://clarisend.co${metadata.path}`,
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          alt: "ClariSend",
        },
      ],
    },
    twitter: {
      title: metadata.title,
      description: metadata.description,
      images: ["/og.svg"],
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      hero: {
        label: "Transparent Pricing",
        title: "Know exactly what you pay",
        description: "No hidden fees, no surprises. See the complete cost breakdown before every transfer.",
      },
      howItWorks: {
        title: "How our pricing works",
        items: [
          {
            title: "Transfer fee",
            description: "A small fixed fee plus a percentage of your send amount. Varies by corridor and payout method. Always shown upfront.",
            example: "Example: $2.99 + 0.5%",
          },
          {
            title: "Exchange rate margin",
            description: "A transparent markup on the mid-market rate. Typically 0.5-2% depending on the currency pair.",
            example: "Example: 1.2% margin",
          },
          {
            title: "No hidden charges",
            description: "What you see is what you pay. No receiving fees, no intermediary bank charges, no processing fees.",
            example: "Total: Exactly as quoted",
          },
        ],
      },
      comparison: {
        title: "Compare before you send",
        description: "We show you multiple routes for every transfer so you can choose what matters most to you.",
        features: [
          {
            title: "Lowest fee",
            description: "Highlighted so you can save the most on transfer costs.",
          },
          {
            title: "Best rate",
            description: "The route that maximizes how much your recipient receives.",
          },
          {
            title: "Fastest delivery",
            description: "When speed matters, see which option delivers quickest.",
          },
          {
            title: "Best value",
            description: "Our recommendation balancing cost, speed, and reliability.",
          },
        ],
      },
      example: {
        title: "Sample transfer breakdown",
        subtitle: "Sending $500 USD to Nigeria (NGN)",
        rows: [
          { label: "You send", value: "$500.00 USD", highlight: false },
          { label: "Transfer fee", value: "-$4.99", highlight: false },
          { label: "Amount converted", value: "$495.01 USD", highlight: false },
          { label: "Exchange rate", value: "1 USD = 1,580 NGN", highlight: false },
          { label: "Recipient gets", value: "782,015.80 NGN", highlight: true },
        ],
        note: "Rates are illustrative. Actual rates vary by corridor and provider.",
      },
      cta: {
        title: "Ready to see your rates?",
        description: "Get a live quote for your transfer in seconds.",
        button: "Get live rates",
      },
    },
    fr: {
      hero: {
        label: "Tarification Transparente",
        title: "Sachez exactement ce que vous payez",
        description: "Pas de frais caches, pas de surprises. Voyez la repartition complete des couts avant chaque transfert.",
      },
      howItWorks: {
        title: "Comment fonctionne notre tarification",
        items: [
          {
            title: "Frais de transfert",
            description: "Un petit frais fixe plus un pourcentage du montant envoye. Varie selon le corridor et la methode de paiement.",
            example: "Exemple: 2,99$ + 0,5%",
          },
          {
            title: "Marge de taux de change",
            description: "Une majoration transparente sur le taux moyen du marche. Generalement 0,5-2% selon la paire de devises.",
            example: "Exemple: 1,2% de marge",
          },
          {
            title: "Aucun frais cache",
            description: "Ce que vous voyez est ce que vous payez. Pas de frais de reception, pas de frais bancaires intermediaires.",
            example: "Total: Exactement comme indique",
          },
        ],
      },
      comparison: {
        title: "Comparez avant d'envoyer",
        description: "Nous vous montrons plusieurs routes pour chaque transfert afin que vous puissiez choisir ce qui compte le plus.",
        features: [
          {
            title: "Frais les plus bas",
            description: "Mis en evidence pour economiser le plus sur les couts de transfert.",
          },
          {
            title: "Meilleur taux",
            description: "La route qui maximise ce que votre destinataire recoit.",
          },
          {
            title: "Livraison la plus rapide",
            description: "Quand la vitesse compte, voyez quelle option livre le plus vite.",
          },
          {
            title: "Meilleure valeur",
            description: "Notre recommandation equilibrant cout, vitesse et fiabilite.",
          },
        ],
      },
      example: {
        title: "Exemple de repartition de transfert",
        subtitle: "Envoi de 500$ USD vers le Nigeria (NGN)",
        rows: [
          { label: "Vous envoyez", value: "500,00$ USD", highlight: false },
          { label: "Frais de transfert", value: "-4,99$", highlight: false },
          { label: "Montant converti", value: "495,01$ USD", highlight: false },
          { label: "Taux de change", value: "1 USD = 1 580 NGN", highlight: false },
          { label: "Le destinataire recoit", value: "782 015,80 NGN", highlight: true },
        ],
        note: "Les taux sont indicatifs. Les taux reels varient selon le corridor et le fournisseur.",
      },
      cta: {
        title: "Pret a voir vos taux?",
        description: "Obtenez un devis en direct pour votre transfert en quelques secondes.",
        button: "Voir les taux en direct",
      },
    },
  };

  const t = messages[validLocale];

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="text-sm font-medium text-emerald-600 mb-3 block">{t.hero.label}</span>
            <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
              {t.hero.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t.hero.description}
            </p>
          </div>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-8">{t.howItWorks.title}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.howItWorks.items.map((item, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-semibold mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">{item.example}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Features */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-3">{t.comparison.title}</h2>
            <p className="text-slate-600">{t.comparison.description}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.comparison.features.map((feature, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-5">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Breakdown */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-2">{t.example.title}</h2>
              <p className="text-slate-600">{t.example.subtitle}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {t.example.rows.map((row, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center px-6 py-4 ${
                      row.highlight ? "bg-emerald-50" : ""
                    }`}
                  >
                    <span className={`text-sm ${row.highlight ? "font-medium text-slate-900" : "text-slate-600"}`}>
                      {row.label}
                    </span>
                    <span className={`font-mono ${row.highlight ? "text-lg font-semibold text-emerald-600" : "text-slate-900"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 text-center">{t.example.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-100 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-3">{t.cta.title}</h2>
          <p className="text-slate-600 mb-6">{t.cta.description}</p>
          <TrackedLink
            href="https://app.clarisend.co"
            event="cta_get_started"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {t.cta.button}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
