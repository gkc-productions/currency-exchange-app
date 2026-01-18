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
      title: "International transfers with total transparency",
      description:
        "Compare rates across providers, lock in the best route, and send money abroad with zero hidden fees.",
      path: "/en",
    },
    fr: {
      title: "Transferts internationaux en toute transparence",
      description:
        "Comparez les taux, choisissez la meilleure route et envoyez de l'argent a l'international sans frais caches.",
      path: "/fr",
    },
  } as const;

  const metadata = metadataByLocale[validLocale];

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.path,
      languages: {
        en: "/en",
        fr: "/fr",
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      hero: {
        badge: "Trusted by 10,000+ users worldwide",
        title: "International transfers,",
        titleAccent: "finally transparent",
        description:
          "Compare rates across providers. See exactly what you pay. Send money abroad with zero hidden fees.",
        cta: "Start sending",
        secondaryCta: "See how it works",
        preview: {
          title: "Transfer preview",
          subtitle: "Sending $500 to Nigeria",
          rows: [
            { label: "Transfer fee", value: "$4.99" },
            { label: "Exchange rate", value: "1 USD = 1,580 NGN" },
            { label: "Delivery time", value: "Within 1 business day" },
          ],
          totalLabel: "Recipient gets",
          totalValue: "782,015.80 NGN",
          note: "Final amounts locked at checkout.",
        },
      },
      stats: {
        countries: "50+ countries",
        countriesLabel: "Supported destinations",
        saved: "$2M+",
        savedLabel: "Saved in fees",
        transfers: "100K+",
        transfersLabel: "Transfers completed",
      },
      trust: {
        title: "Why people choose ClariSend",
        items: [
          {
            title: "Complete transparency",
            description: "See the full cost breakdown before you send. No surprises, no hidden charges.",
          },
          {
            title: "Best rates guaranteed",
            description: "We compare routes in real-time to find you the lowest fees and best exchange rates.",
          },
          {
            title: "Bank-grade security",
            description: "256-bit encryption, licensed partners, and full regulatory compliance.",
          },
        ],
      },
      howItWorks: {
        label: "How it works",
        title: "Send money in three steps",
        steps: [
          {
            step: "1",
            title: "Enter your transfer",
            description: "Choose currencies and amount. We show you all available routes instantly.",
          },
          {
            step: "2",
            title: "Compare and choose",
            description: "See fees, rates, and delivery times side-by-side. Pick what works for you.",
          },
          {
            step: "3",
            title: "Send securely",
            description: "Complete payment and track your transfer in real-time until delivery.",
          },
        ],
      },
      security: {
        label: "Security & Compliance",
        title: "Your money is protected",
        description: "We partner with licensed financial institutions and follow strict regulatory standards to keep your transfers safe.",
        features: [
          "End-to-end encryption",
          "Licensed payment providers",
          "AML/KYC compliant",
          "Real-time fraud monitoring",
        ],
      },
      cta: {
        title: "Ready to save on your next transfer?",
        description: "Join thousands who trust ClariSend for transparent international money transfers.",
        button: "Get started free",
        note: "No account fees. Cancel anytime.",
      },
    },
    fr: {
      hero: {
        badge: "Plus de 10 000 utilisateurs nous font confiance",
        title: "Transferts internationaux,",
        titleAccent: "enfin transparents",
        description:
          "Comparez les taux entre fournisseurs. Voyez exactement ce que vous payez. Envoyez de l'argent sans frais caches.",
        cta: "Commencer",
        secondaryCta: "Comment ca marche",
        preview: {
          title: "Apercu du transfert",
          subtitle: "Envoi de 500$ vers le Nigeria",
          rows: [
            { label: "Frais de transfert", value: "4,99$" },
            { label: "Taux de change", value: "1 USD = 1 580 NGN" },
            { label: "Delai de livraison", value: "Sous 1 jour ouvrable" },
          ],
          totalLabel: "Le destinataire recoit",
          totalValue: "782 015,80 NGN",
          note: "Montants finaux bloques a la validation.",
        },
      },
      stats: {
        countries: "50+ pays",
        countriesLabel: "Destinations supportees",
        saved: "2M$+",
        savedLabel: "Economies en frais",
        transfers: "100K+",
        transfersLabel: "Transferts completes",
      },
      trust: {
        title: "Pourquoi choisir ClariSend",
        items: [
          {
            title: "Transparence complete",
            description: "Voyez la repartition complete des couts avant d'envoyer. Pas de surprises.",
          },
          {
            title: "Meilleurs taux garantis",
            description: "Nous comparons les routes en temps reel pour trouver les frais les plus bas.",
          },
          {
            title: "Securite bancaire",
            description: "Chiffrement 256 bits, partenaires agrees et conformite reglementaire complete.",
          },
        ],
      },
      howItWorks: {
        label: "Comment ca marche",
        title: "Envoyez de l'argent en trois etapes",
        steps: [
          {
            step: "1",
            title: "Entrez votre transfert",
            description: "Choisissez les devises et le montant. Nous vous montrons toutes les routes disponibles.",
          },
          {
            step: "2",
            title: "Comparez et choisissez",
            description: "Voyez les frais, taux et delais cote a cote. Choisissez ce qui vous convient.",
          },
          {
            step: "3",
            title: "Envoyez en securite",
            description: "Effectuez le paiement et suivez votre transfert en temps reel.",
          },
        ],
      },
      security: {
        label: "Securite & Conformite",
        title: "Votre argent est protege",
        description: "Nous travaillons avec des institutions financieres agreees et suivons des normes reglementaires strictes.",
        features: [
          "Chiffrement de bout en bout",
          "Fournisseurs de paiement agrees",
          "Conforme AML/KYC",
          "Surveillance des fraudes en temps reel",
        ],
      },
      cta: {
        title: "Pret a economiser sur votre prochain transfert?",
        description: "Rejoignez les milliers de personnes qui font confiance a ClariSend.",
        button: "Commencer gratuitement",
        note: "Pas de frais de compte. Annulez a tout moment.",
      },
    },
  };

  const t = messages[validLocale];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="max-w-2xl lg:max-w-none">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-sm text-emerald-700 font-medium">{t.hero.badge}</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-6">
                {t.hero.title}
                <br />
                <span className="text-emerald-600">{t.hero.titleAccent}</span>
              </h1>

              {/* Description */}
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-8">
                {t.hero.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
              <TrackedLink
                href="https://app.clarisend.co"
                event="cta_start_sending"
                className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                {t.hero.cta}
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </TrackedLink>
              <TrackedLink
                href={`/${validLocale}/how-it-works`}
                event="cta_see_how_it_works"
                className="inline-flex items-center justify-center text-slate-700 hover:text-slate-900 font-medium px-6 py-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                {t.hero.secondaryCta}
              </TrackedLink>
              </div>
            </div>
            <div className="w-full max-w-lg lg:justify-self-end">
              <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <div className="mb-6">
                  <p className="text-sm text-slate-500">{t.hero.preview.title}</p>
                  <p className="text-xl font-semibold text-slate-900">{t.hero.preview.subtitle}</p>
                </div>
                <div className="space-y-4">
                  {t.hero.preview.rows.map((row, index) => (
                    <div key={index} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{row.label}</span>
                      <span className="text-slate-900 font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-emerald-700 font-medium">{t.hero.preview.totalLabel}</span>
                  <span className="text-lg font-semibold text-emerald-700">{t.hero.preview.totalValue}</span>
                </div>
                <p className="text-xs text-slate-500 mt-4">{t.hero.preview.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-white">{t.stats.countries}</p>
              <p className="text-sm text-slate-400 mt-1">{t.stats.countriesLabel}</p>
            </div>
            <div className="text-center sm:border-x sm:border-slate-700">
              <p className="text-2xl lg:text-3xl font-bold text-white">{t.stats.saved}</p>
              <p className="text-sm text-slate-400 mt-1">{t.stats.savedLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-white">{t.stats.transfers}</p>
              <p className="text-sm text-slate-400 mt-1">{t.stats.transfersLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              {t.trust.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {t.trust.items.map((item, index) => (
              <div key={index} className="text-center md:text-left">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                    {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                    {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-sm font-medium text-emerald-600 mb-2 block">{t.howItWorks.label}</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{t.howItWorks.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-slate-200 -translate-x-1/2" />
                )}
                <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 relative">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-semibold mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-slate-900 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="text-sm font-medium text-emerald-400 mb-2 block">{t.security.label}</span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{t.security.title}</h2>
                <p className="text-slate-300 leading-relaxed">{t.security.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {t.security.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t.cta.title}</h2>
          <p className="text-lg text-slate-600 mb-8">{t.cta.description}</p>
          <TrackedLink
            href="https://app.clarisend.co"
            event="cta_get_started"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3.5 rounded-lg transition-colors"
          >
            {t.cta.button}
          </TrackedLink>
          <p className="text-sm text-slate-500 mt-4">{t.cta.note}</p>
        </div>
      </section>
    </div>
  );
}
