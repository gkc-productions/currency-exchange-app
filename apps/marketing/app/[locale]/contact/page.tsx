export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      hero: {
        label: "Contact",
        title: "Get in touch",
        description: "Have questions about ClariSend? We're here to help.",
      },
      contact: {
        email: {
          title: "Email support",
          value: "support@clarisend.co",
          description: "We typically respond within 24 hours",
        },
        hours: {
          title: "Support hours",
          value: "Monday - Friday, 9AM - 6PM UTC",
          description: "Available for all your transfer questions",
        },
      },
      faq: {
        label: "FAQ",
        title: "Common questions",
        items: [
          {
            q: "How long do transfers take?",
            a: "Transfer times vary by route and payout method. Bank transfers typically arrive within 1-3 business days. Mobile money and Lightning payments are usually instant.",
          },
          {
            q: "What fees will I pay?",
            a: "Fees vary by corridor and payout method. We always show you the complete breakdown before you confirm - transfer fee, exchange rate, and exactly what your recipient will receive.",
          },
          {
            q: "Is my money secure?",
            a: "Yes. We use bank-grade encryption (TLS 1.3, AES-256) and partner exclusively with licensed payment providers. Your funds are protected throughout the entire transfer.",
          },
          {
            q: "Can I track my transfer?",
            a: "Every transfer receives a unique reference code. You can check your transfer status anytime in the app or by contacting our support team.",
          },
          {
            q: "Which countries do you support?",
            a: "We currently support transfers to 50+ countries across Africa, Asia, Europe, and the Americas. Check the app for the full list of available corridors.",
          },
          {
            q: "What payout methods are available?",
            a: "Depending on the destination, recipients can receive funds via bank transfer, mobile money, or Bitcoin Lightning. Available options are shown when you create a transfer.",
          },
        ],
      },
      cta: {
        title: "Ready to send money?",
        description: "Start your first transfer today.",
        button: "Get started",
      },
    },
    fr: {
      hero: {
        label: "Contact",
        title: "Contactez-nous",
        description: "Des questions sur ClariSend? Nous sommes la pour vous aider.",
      },
      contact: {
        email: {
          title: "Support par email",
          value: "support@clarisend.co",
          description: "Nous repondons generalement sous 24 heures",
        },
        hours: {
          title: "Heures de support",
          value: "Lundi - Vendredi, 9h - 18h UTC",
          description: "Disponible pour toutes vos questions de transfert",
        },
      },
      faq: {
        label: "FAQ",
        title: "Questions frequentes",
        items: [
          {
            q: "Combien de temps prennent les transferts?",
            a: "Les delais varient selon la route et la methode de paiement. Les virements bancaires arrivent generalement en 1-3 jours ouvrables. Mobile money et Lightning sont habituellement instantanes.",
          },
          {
            q: "Quels frais vais-je payer?",
            a: "Les frais varient selon le corridor et la methode. Nous vous montrons toujours la repartition complete avant confirmation - frais de transfert, taux de change et montant exact recu.",
          },
          {
            q: "Mon argent est-il securise?",
            a: "Oui. Nous utilisons un chiffrement bancaire (TLS 1.3, AES-256) et travaillons exclusivement avec des fournisseurs agrees. Vos fonds sont proteges tout au long du transfert.",
          },
          {
            q: "Puis-je suivre mon transfert?",
            a: "Chaque transfert recoit un code de reference unique. Vous pouvez verifier le statut a tout moment dans l'application ou en contactant notre support.",
          },
          {
            q: "Quels pays supportez-vous?",
            a: "Nous supportons actuellement les transferts vers 50+ pays en Afrique, Asie, Europe et Ameriques. Consultez l'application pour la liste complete.",
          },
          {
            q: "Quelles methodes de paiement sont disponibles?",
            a: "Selon la destination, les destinataires peuvent recevoir par virement bancaire, mobile money ou Bitcoin Lightning. Les options disponibles sont affichees lors de la creation.",
          },
        ],
      },
      cta: {
        title: "Pret a envoyer de l'argent?",
        description: "Commencez votre premier transfert aujourd'hui.",
        button: "Commencer",
      },
    },
  };

  const t = messages[validLocale];

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
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

      {/* Contact Cards */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Email */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{t.contact.email.title}</h3>
              <a
                href={`mailto:${t.contact.email.value}`}
                className="text-emerald-600 hover:text-emerald-700 font-medium block mb-2"
              >
                {t.contact.email.value}
              </a>
              <p className="text-sm text-slate-600">{t.contact.email.description}</p>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{t.contact.hours.title}</h3>
              <p className="font-medium text-slate-900 mb-2">{t.contact.hours.value}</p>
              <p className="text-sm text-slate-600">{t.contact.hours.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-5xl">
            <span className="text-sm font-medium text-emerald-600 mb-2 block">{t.faq.label}</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-8">{t.faq.title}</h2>
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
              {t.faq.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 rounded-xl p-6"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 border-t border-slate-100 py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.cta.title}</h2>
          <p className="text-slate-600 mb-6">{t.cta.description}</p>
          <a
            href="https://app.clarisend.co"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {t.cta.button}
          </a>
        </div>
      </section>
    </div>
  );
}
