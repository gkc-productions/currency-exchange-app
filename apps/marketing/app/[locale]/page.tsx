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
        title: "Send Money Globally",
        subtitle: "With Crystal-Clear Pricing",
        description:
          "Compare routes, minimize fees, and get the best rates for your international money transfers. No hidden costs, ever.",
        cta: "Start Sending Money",
        secondary: "See how it works",
      },
      trust: {
        title: "Trusted by thousands",
        transparent: "100% Transparent Fees",
        secure: "Bank-Level Security",
        fast: "Fast Global Transfers",
      },
      features: {
        title: "Why ClariSend?",
        compare: {
          title: "Compare All Routes",
          description:
            "See every available option side-by-side. Choose the cheapest, fastest, or best value route for your needs.",
        },
        transparent: {
          title: "Transparent Pricing",
          description:
            "Know exactly what you're paying before you send. No surprise fees, no hidden charges, no fine print.",
        },
        secure: {
          title: "Bank-Grade Security",
          description:
            "Your money and data are protected with enterprise-level encryption and compliance standards.",
        },
      },
      cta: {
        title: "Ready to send money?",
        description: "Join thousands of people who trust ClariSend for their international transfers.",
        button: "Get Started Now",
      },
    },
    fr: {
      hero: {
        title: "Envoyez de l'argent dans le monde entier",
        subtitle: "Avec une tarification claire",
        description:
          "Comparez les routes, minimisez les frais et obtenez les meilleurs taux pour vos transferts internationaux. Aucun coût caché, jamais.",
        cta: "Commencer à envoyer",
        secondary: "Comment ça marche",
      },
      trust: {
        title: "Approuvé par des milliers",
        transparent: "Frais 100% transparents",
        secure: "Sécurité bancaire",
        fast: "Transferts mondiaux rapides",
      },
      features: {
        title: "Pourquoi ClariSend?",
        compare: {
          title: "Comparez toutes les routes",
          description:
            "Visualisez toutes les options côte à côte. Choisissez la route la moins chère, la plus rapide ou la meilleure valeur.",
        },
        transparent: {
          title: "Tarification transparente",
          description:
            "Sachez exactement ce que vous payez avant d'envoyer. Pas de frais surprises, pas de frais cachés.",
        },
        secure: {
          title: "Sécurité de niveau bancaire",
          description:
            "Votre argent et vos données sont protégés avec un chiffrement et des normes de conformité de niveau entreprise.",
        },
      },
      cta: {
        title: "Prêt à envoyer de l'argent?",
        description: "Rejoignez des milliers de personnes qui font confiance à ClariSend.",
        button: "Commencer maintenant",
      },
    },
  };

  const t = messages[validLocale];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              {t.hero.title}
              <br />
              <span className="text-emerald-600">{t.hero.subtitle}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">{t.hero.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://app.clarisend.co"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-lg shadow-lg"
              >
                {t.hero.cta}
              </a>
              <a
                href={`/${validLocale}/how-it-works`}
                className="bg-white hover:bg-slate-50 text-emerald-600 font-semibold px-8 py-4 rounded-2xl transition-colors text-lg border-2 border-emerald-600"
              >
                {t.hero.secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                {t.trust.transparent}
              </h3>
            </div>
            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                {t.trust.secure}
              </h3>
            </div>
            <div>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                {t.trust.fast}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[var(--brand-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
            {t.features.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t.features.compare.title}
              </h3>
              <p className="text-slate-600">{t.features.compare.description}</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t.features.transparent.title}
              </h3>
              <p className="text-slate-600">
                {t.features.transparent.description}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t.features.secure.title}
              </h3>
              <p className="text-slate-600">{t.features.secure.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-xl text-emerald-100 mb-8">{t.cta.description}</p>
          <a
            href="https://app.clarisend.co"
            className="inline-block bg-white hover:bg-emerald-50 text-emerald-600 font-semibold px-8 py-4 rounded-2xl transition-colors text-lg shadow-lg"
          >
            {t.cta.button}
          </a>
        </div>
      </section>
    </div>
  );
}
