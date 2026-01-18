import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const metadataByLocale = {
    en: {
      title: "Security and compliance",
      description:
        "Bank-grade encryption, licensed partners, and real-time monitoring keep every transfer protected.",
      path: "/en/security",
    },
    fr: {
      title: "Securite et conformite",
      description:
        "Chiffrement bancaire, partenaires agrees et surveillance en temps reel pour proteger chaque transfert.",
      path: "/fr/security",
    },
  } as const;

  const metadata = metadataByLocale[validLocale];

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: metadata.path,
      languages: {
        en: "/en/security",
        fr: "/fr/security",
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

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      hero: {
        label: "Security & Compliance",
        title: "Your money deserves bank-grade protection",
        description: "We've built ClariSend with security at its core. Every transfer is protected by enterprise-level infrastructure and regulatory compliance.",
      },
      features: [
        {
          title: "End-to-end encryption",
          description: "All data is encrypted using TLS 1.3 in transit and AES-256 at rest. Your sensitive information is protected at every step of the transfer process.",
          icon: "lock",
        },
        {
          title: "Licensed payment partners",
          description: "We work exclusively with regulated financial institutions and licensed money transfer operators. Your funds are always handled by trusted, compliant partners.",
          icon: "shield",
        },
        {
          title: "No credential storage",
          description: "We never store your payment credentials. Card details and bank information are tokenized and processed securely by our PCI-DSS compliant partners.",
          icon: "key",
        },
        {
          title: "Real-time fraud monitoring",
          description: "Our systems continuously monitor for suspicious activity. Unusual patterns trigger automatic security checks to protect your account.",
          icon: "eye",
        },
        {
          title: "Regulatory compliance",
          description: "ClariSend operates in full compliance with international money transfer regulations, anti-money laundering (AML) requirements, and KYC standards.",
          icon: "document",
        },
        {
          title: "Transfer tracking",
          description: "Every transfer receives a unique reference code. Track your money in real-time from initiation to delivery with complete visibility.",
          icon: "track",
        },
      ],
      commitment: {
        title: "Our security commitment",
        description: "Security isn't a feature - it's the foundation of everything we build. We continuously invest in protecting your transfers and personal information.",
        points: [
          "Regular security audits and penetration testing",
          "24/7 infrastructure monitoring",
          "Dedicated security response team",
          "Transparent incident communication",
        ],
      },
      cta: {
        title: "Questions about security?",
        description: "Our team is available to discuss our security practices and answer any questions you may have.",
        button: "Contact us",
        link: "contact",
      },
    },
    fr: {
      hero: {
        label: "Securite & Conformite",
        title: "Votre argent merite une protection bancaire",
        description: "ClariSend est construit avec la securite au coeur. Chaque transfert est protege par une infrastructure de niveau entreprise et la conformite reglementaire.",
      },
      features: [
        {
          title: "Chiffrement de bout en bout",
          description: "Toutes les donnees sont chiffrees avec TLS 1.3 en transit et AES-256 au repos. Vos informations sensibles sont protegees a chaque etape.",
          icon: "lock",
        },
        {
          title: "Partenaires de paiement agrees",
          description: "Nous travaillons exclusivement avec des institutions financieres reglementees. Vos fonds sont toujours geres par des partenaires fiables et conformes.",
          icon: "shield",
        },
        {
          title: "Aucun stockage d'identifiants",
          description: "Nous ne stockons jamais vos identifiants de paiement. Les details de carte sont tokenises et traites par nos partenaires conformes PCI-DSS.",
          icon: "key",
        },
        {
          title: "Surveillance des fraudes en temps reel",
          description: "Nos systemes surveillent en continu les activites suspectes. Les comportements inhabituels declenchent des verifications automatiques.",
          icon: "eye",
        },
        {
          title: "Conformite reglementaire",
          description: "ClariSend opere en conformite totale avec les reglementations internationales, les exigences anti-blanchiment et les normes KYC.",
          icon: "document",
        },
        {
          title: "Suivi des transferts",
          description: "Chaque transfert recoit un code de reference unique. Suivez votre argent en temps reel du debut a la livraison.",
          icon: "track",
        },
      ],
      commitment: {
        title: "Notre engagement securite",
        description: "La securite n'est pas une fonctionnalite - c'est la fondation de tout ce que nous construisons. Nous investissons continuellement dans la protection.",
        points: [
          "Audits de securite et tests de penetration reguliers",
          "Surveillance de l'infrastructure 24/7",
          "Equipe de reponse securite dediee",
          "Communication transparente des incidents",
        ],
      },
      cta: {
        title: "Questions sur la securite?",
        description: "Notre equipe est disponible pour discuter de nos pratiques de securite et repondre a vos questions.",
        button: "Nous contacter",
        link: "contact",
      },
    },
  };

  const t = messages[validLocale];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "lock":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />;
      case "shield":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />;
      case "key":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />;
      case "eye":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
      case "document":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case "track":
        return <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />;
      default:
        return null;
    }
  };

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

      {/* Security Features Grid */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6"
              >
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {getIcon(feature.icon)}
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-slate-900 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{t.commitment.title}</h2>
                <p className="text-slate-300 leading-relaxed">{t.commitment.description}</p>
              </div>
              <div className="space-y-4">
                {t.commitment.points.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 border-t border-slate-100 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.cta.title}</h2>
          <p className="text-slate-600 mb-6">{t.cta.description}</p>
          <a
            href={`/${validLocale}/${t.cta.link}`}
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {t.cta.button}
          </a>
        </div>
      </section>
    </div>
  );
}
