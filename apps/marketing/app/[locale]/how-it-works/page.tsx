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
      title: "How ClariSend works",
      description:
        "Follow a three-step flow to compare routes, lock your rate, and track delivery in real time.",
      path: "/en/how-it-works",
    },
    fr: {
      title: "Comment fonctionne ClariSend",
      description:
        "Suivez un parcours simple pour comparer les routes, verrouiller votre taux et suivre la livraison.",
      path: "/fr/how-it-works",
    },
  } as const;

  const metadata = metadataByLocale[validLocale];

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.path,
      languages: {
        en: "/en/how-it-works",
        fr: "/fr/how-it-works",
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

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      hero: {
        label: "How it works",
        title: "Send money in minutes, not days",
        description: "Our streamlined process makes international transfers simple, fast, and completely transparent.",
      },
      steps: [
        {
          step: "01",
          title: "Enter your transfer details",
          description: "Select your source and destination currencies, enter the amount you want to send, and choose your preferred payout method.",
          features: [
            "50+ supported countries",
            "Bank transfer, mobile money, or Lightning",
            "Real-time exchange rates",
          ],
        },
        {
          step: "02",
          title: "Compare available routes",
          description: "We show you every available option with complete cost breakdowns. Compare fees, exchange rates, and delivery times side-by-side.",
          features: [
            "Multiple provider options",
            "Lowest fee highlighted",
            "Fastest delivery shown",
          ],
        },
        {
          step: "03",
          title: "Lock your rate and pay",
          description: "Choose your preferred route and lock in your exchange rate. Complete payment securely through your chosen method.",
          features: [
            "Rate locked for 30 seconds",
            "Secure payment processing",
            "Instant confirmation",
          ],
        },
        {
          step: "04",
          title: "Track until delivery",
          description: "Receive a unique reference code and track your transfer in real-time. Get notifications at every step until your recipient receives the funds.",
          features: [
            "Real-time status updates",
            "Email notifications",
            "Support available 24/7",
          ],
        },
      ],
      payoutMethods: {
        label: "Payout options",
        title: "Multiple ways to receive",
        description: "Your recipient can receive funds through their preferred method.",
        methods: [
          {
            title: "Bank Transfer",
            description: "Direct deposit to any bank account. Typically arrives in 1-3 business days.",
          },
          {
            title: "Mobile Money",
            description: "Instant delivery to mobile wallets. Available in select African countries.",
          },
          {
            title: "Lightning Network",
            description: "Instant Bitcoin delivery via Lightning. Zero waiting time.",
          },
        ],
      },
      cta: {
        title: "Ready to try it yourself?",
        description: "See how easy international transfers can be.",
        button: "Start your first transfer",
      },
    },
    fr: {
      hero: {
        label: "Comment ca marche",
        title: "Envoyez de l'argent en minutes",
        description: "Notre processus simplifie les transferts internationaux: simple, rapide et totalement transparent.",
      },
      steps: [
        {
          step: "01",
          title: "Entrez les details du transfert",
          description: "Selectionnez vos devises source et destination, entrez le montant et choisissez votre methode de paiement preferee.",
          features: [
            "50+ pays supportes",
            "Virement bancaire, mobile money ou Lightning",
            "Taux de change en temps reel",
          ],
        },
        {
          step: "02",
          title: "Comparez les routes disponibles",
          description: "Nous vous montrons toutes les options avec une repartition complete des couts. Comparez les frais, taux et delais.",
          features: [
            "Options de plusieurs fournisseurs",
            "Frais les plus bas mis en evidence",
            "Livraison la plus rapide affichee",
          ],
        },
        {
          step: "03",
          title: "Verrouillez votre taux et payez",
          description: "Choisissez votre route preferee et verrouillez votre taux. Effectuez le paiement en toute securite.",
          features: [
            "Taux verrouille 30 secondes",
            "Traitement securise des paiements",
            "Confirmation instantanee",
          ],
        },
        {
          step: "04",
          title: "Suivez jusqu'a la livraison",
          description: "Recevez un code de reference unique et suivez votre transfert en temps reel jusqu'a reception.",
          features: [
            "Mises a jour en temps reel",
            "Notifications par email",
            "Support disponible 24/7",
          ],
        },
      ],
      payoutMethods: {
        label: "Options de paiement",
        title: "Plusieurs facons de recevoir",
        description: "Votre destinataire peut recevoir les fonds par sa methode preferee.",
        methods: [
          {
            title: "Virement bancaire",
            description: "Depot direct sur n'importe quel compte bancaire. Arrive generalement en 1-3 jours ouvrables.",
          },
          {
            title: "Mobile Money",
            description: "Livraison instantanee vers les portefeuilles mobiles. Disponible dans certains pays africains.",
          },
          {
            title: "Reseau Lightning",
            description: "Livraison Bitcoin instantanee via Lightning. Zero temps d'attente.",
          },
        ],
      },
      cta: {
        title: "Pret a essayer?",
        description: "Decouvrez la simplicite des transferts internationaux.",
        button: "Commencer votre premier transfert",
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
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              {t.hero.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t.hero.description}
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="space-y-6 lg:space-y-8">
            {t.steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl text-lg font-semibold">
                      {step.step}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      {step.title}
                    </h2>
                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {step.features.map((feature, featureIndex) => (
                        <span
                          key={featureIndex}
                          className="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payout Methods */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-emerald-600 mb-2 block">{t.payoutMethods.label}</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.payoutMethods.title}</h2>
            <p className="text-slate-600 max-w-xl mx-auto">{t.payoutMethods.description}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {t.payoutMethods.methods.map((method, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6">
                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />}
                    {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />}
                    {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />}
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{method.title}</h3>
                <p className="text-sm text-slate-600">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 border-t border-slate-100 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.cta.title}</h2>
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
