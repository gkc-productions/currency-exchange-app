export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: "en" | "fr" = locale === "fr" ? "fr" : "en";

  const messages = {
    en: {
      title: "How ClariSend Works",
      subtitle: "Send money internationally in four simple steps",
      steps: [
        {
          title: "1. Enter Transfer Details",
          description:
            "Choose your currencies, enter the amount you want to send, and select your preferred payout method (bank transfer, mobile money, or Bitcoin Lightning).",
        },
        {
          title: "2. Compare Routes",
          description:
            "We show you all available routes with transparent pricing. See the cheapest option, fastest delivery, and best value side-by-side. No hidden fees, ever.",
        },
        {
          title: "3. Complete Payment",
          description:
            "Lock in your rate and complete the transfer. For Bitcoin Lightning payments, you'll receive a Lightning invoice to pay. Your quote is locked for 30 seconds.",
        },
        {
          title: "4. Track Your Transfer",
          description:
            "Get real-time updates as your money moves. You'll receive a unique reference code to track your transfer from start to finish.",
        },
      ],
      cta: "Start Your First Transfer",
    },
    fr: {
      title: "Comment fonctionne ClariSend",
      subtitle: "Envoyez de l'argent à l'international en quatre étapes simples",
      steps: [
        {
          title: "1. Entrez les détails du transfert",
          description:
            "Choisissez vos devises, entrez le montant à envoyer et sélectionnez votre méthode de paiement (virement bancaire, mobile money ou Bitcoin Lightning).",
        },
        {
          title: "2. Comparez les routes",
          description:
            "Nous vous montrons toutes les routes disponibles avec une tarification transparente. Voyez l'option la moins chère, la livraison la plus rapide et la meilleure valeur côte à côte.",
        },
        {
          title: "3. Effectuez le paiement",
          description:
            "Verrouillez votre taux et effectuez le transfert. Pour les paiements Bitcoin Lightning, vous recevrez une facture Lightning. Votre devis est verrouillé pendant 30 secondes.",
        },
        {
          title: "4. Suivez votre transfert",
          description:
            "Recevez des mises à jour en temps réel. Vous recevrez un code de référence unique pour suivre votre transfert du début à la fin.",
        },
      ],
      cta: "Commencer votre premier transfert",
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

        <div className="space-y-12">
          {t.steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {step.title}
              </h2>
              <p className="text-lg text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
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
