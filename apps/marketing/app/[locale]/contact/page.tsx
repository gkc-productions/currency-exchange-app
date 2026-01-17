export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      title: "Get in Touch",
      subtitle: "We're here to help with your money transfers",
      email: {
        title: "Email Us",
        address: "support@clarisend.co",
        description: "We typically respond within 24 hours",
      },
      support: {
        title: "Support Hours",
        hours: "Monday - Friday: 9:00 AM - 6:00 PM UTC",
        description: "We're committed to helping you send money with confidence",
      },
      faq: {
        title: "Common Questions",
        items: [
          {
            q: "How long do transfers take?",
            a: "Transfer times vary by route and payout method. Most bank transfers arrive within 1-3 business days. Mobile money and Lightning payments are typically instant.",
          },
          {
            q: "What are your fees?",
            a: "Fees vary by corridor and payout method. We always show you the full breakdown before you send. There are no hidden charges.",
          },
          {
            q: "Is ClariSend secure?",
            a: "Yes. We use bank-grade encryption and partner with licensed payment providers. Your data and money are protected at every step.",
          },
          {
            q: "Can I track my transfer?",
            a: "Absolutely. Every transfer gets a unique reference code. You can check the status anytime using your transfer ID.",
          },
        ],
      },
    },
    fr: {
      title: "Contactez-nous",
      subtitle: "Nous sommes là pour vous aider avec vos transferts d'argent",
      email: {
        title: "Envoyez-nous un email",
        address: "support@clarisend.co",
        description: "Nous répondons généralement dans les 24 heures",
      },
      support: {
        title: "Heures de support",
        hours: "Lundi - Vendredi: 9h00 - 18h00 UTC",
        description: "Nous nous engageons à vous aider à envoyer de l'argent en toute confiance",
      },
      faq: {
        title: "Questions courantes",
        items: [
          {
            q: "Combien de temps prennent les transferts?",
            a: "Les délais varient selon la route et la méthode. La plupart des virements bancaires arrivent dans 1-3 jours ouvrables. Mobile money et Lightning sont généralement instantanés.",
          },
          {
            q: "Quels sont vos frais?",
            a: "Les frais varient selon le corridor et la méthode. Nous vous montrons toujours la répartition complète avant d'envoyer. Il n'y a pas de frais cachés.",
          },
          {
            q: "ClariSend est-il sécurisé?",
            a: "Oui. Nous utilisons le chiffrement de niveau bancaire et nous associons à des fournisseurs de paiement agréés. Vos données et votre argent sont protégés.",
          },
          {
            q: "Puis-je suivre mon transfert?",
            a: "Absolument. Chaque transfert reçoit un code de référence unique. Vous pouvez vérifier le statut à tout moment.",
          },
        ],
      },
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Email */}
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t.email.title}
            </h2>
            <a
              href={`mailto:${t.email.address}`}
              className="text-emerald-600 hover:text-emerald-700 font-medium block mb-2"
            >
              {t.email.address}
            </a>
            <p className="text-sm text-slate-600">{t.email.description}</p>
          </div>

          {/* Support Hours */}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t.support.title}
            </h2>
            <p className="font-medium text-slate-900 mb-2">{t.support.hours}</p>
            <p className="text-sm text-slate-600">{t.support.description}</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {t.faq.title}
          </h2>
          <div className="space-y-6">
            {t.faq.items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.q}
                </h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
