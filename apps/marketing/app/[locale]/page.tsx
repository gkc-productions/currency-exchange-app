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
      title: "Send money home without the anxiety",
      description:
        "Most remittance apps compete on speed or price, then leave you guessing what actually happened. ClariSend shows you exactly what you're paying, where your money is, and when it will arrive.",
      path: "/en",
    },
    fr: {
      title: "Envoyez avec clarté",
      description:
        "Une expérience simple pour suivre vos transferts et comprendre les frais.",
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

  const content = {
    en: {
      hero: {
        title: "Send money home without the anxiety.",
        description:
          "Most remittance apps compete on speed or price, then leave you guessing what actually happened. ClariSend shows you exactly what you're paying, where your money is, and when it will arrive.",
        primaryCta: "Start a transfer",
        secondaryCta: "View fees",
        cardTitle: "Transfer tracking",
        cardItems: [
          "Confirmed",
          "Payment Received",
          "Sent to Partner Bank",
          "Received by Partner Bank",
          "Ready for Recipient",
        ],
      },
      problem: {
        label: "Problem statement",
        title: "You send money home every month, and every month it's the same frustration.",
        paragraphs: [
          "You see one exchange rate when you start, another when you confirm, and the amount your family receives never quite matches what you expected. The fees are split across multiple line items with vague labels, and you're never sure if you're seeing the full cost.",
          "After you send, the app goes quiet. You get a generic \"processing\" message that stays unchanged for days. Your family calls asking when the money will arrive, and you have no answer. You check the app again and see the same status. No one tells you what's actually happening.",
          "When something does go wrong, support can't see your transfer details. You repeat your confirmation number multiple times. They ask you to send screenshots. They promise to \"escalate\" your issue. Days pass. The money is somewhere in the system, but no one can tell you where or why it's stuck.",
        ],
      },
      difference: {
        label: "",
        title: "How ClariSend is different",
        items: [
          {
            title: "Hidden fees",
            description:
              "ClariSend shows you the total cost before you confirm. One number that includes the transfer fee, the exchange rate markup, and any intermediary charges. What you see is what you pay.",
          },
          {
            title: "Vague status updates",
            description:
              "Every transfer has a timeline with specific stages: confirmed, sent to partner bank, received by partner bank, ready for pickup or deposit. Each stage updates in real time with a timestamp. You always know where your money is.",
          },
          {
            title: "Recipients don't know what's happening",
            description:
              "ClariSend sends your recipient a text message when you initiate the transfer, another when funds are ready, and instructions for pickup or deposit. They're informed in their language before they ask you.",
          },
          {
            title: "Support can't see your transfer",
            description:
              "When you contact ClariSend support, the agent sees your full transfer history, current status, and transaction details. They don't need screenshots or repeated explanations. They can resolve issues without escalation loops.",
          },
        ],
      },
      howItWorks: {
        label: "",
        title: "How it works",
        steps: [
          {
            title: "Step 1: See the full cost",
            description:
              "Enter the amount you want to send. ClariSend shows you the exchange rate, all fees, and the exact amount your recipient will receive. This quote is locked for 30 minutes.",
          },
          {
            title: "Step 2: Confirm and send",
            description:
              "Choose your payment method and confirm. Your recipient gets a text message immediately with an estimated arrival time and instructions.",
          },
          {
            title: "Step 3: Track your transfer",
            description:
              "Watch your transfer move through each stage. You'll see when ClariSend receives your funds, when they're sent to the partner bank, and when they're ready for your recipient.",
          },
          {
            title: "Step 4: Your recipient gets paid",
            description:
              "Your recipient receives a text with pickup or deposit instructions. If they have questions, the message includes a reference number and local support contact.",
          },
        ],
      },
      transparency: {
        label: "",
        title: "Transparency section",
        paragraphs: [
          "ClariSend locks your exchange rate and fees when you confirm your transfer. If the rate changes while you're entering your information, you'll see the update before you pay. There are no post-confirmation adjustments.",
          "The total cost you see includes everything: the transfer fee, the difference between the market rate and the rate you're getting, and any charges from partner banks or payment networks. ClariSend doesn't hide markup in the exchange rate and claim zero fees.",
          "If your transfer requires additional information or documentation to complete, ClariSend will tell you before you pay, not after. You won't confirm a transfer only to find out later that it can't be processed.",
        ],
      },
      tracking: {
        label: "",
        title: "Transfer tracking",
        stagesTitle: "Your transfer has five stages: Confirmed, Payment Received, Sent to Partner Bank, Received by Partner Bank, and Ready for Recipient. Each stage shows a timestamp and updates automatically.",
        paragraphs: [
          "You can check status anytime in the app or on the web. If a transfer is delayed, you'll see why. Common reasons include bank holidays, recipient information that needs verification, or holds required by local regulations. ClariSend shows you the specific reason and what happens next.",
          "You don't have to wonder if checking the app will give you new information. If the status has changed, you'll get a notification. If it hasn't changed, the app will tell you when to expect the next update.",
        ],
      },
      recipient: {
        label: "",
        title: "Recipient experience",
        paragraphs: [
          "When you send money, your recipient gets a text message in their local language. The message tells them how much they're receiving, when it will be available, and how to collect it.",
          "If the money is being deposited directly, the message confirms the account number and expected deposit time. If it's a cash pickup, the message includes the pickup location, required ID, and a reference number.",
          "Recipients can reply to the message if they have questions. Responses go to local support staff who can see the transfer details and help resolve issues without asking the recipient to contact you first.",
        ],
      },
      trust: {
        label: "",
        title: "Trust & Safety",
        paragraphs: [
          "ClariSend holds your funds in segregated accounts at regulated financial institutions. Your money is separated from ClariSend's operating funds and can only be used to complete your transfer.",
          "If a transfer cannot be completed, ClariSend refunds the full amount you paid, including all fees. Refunds are processed to your original payment method within 3-5 business days.",
          "Every transfer is monitored for compliance with anti-money laundering regulations and sanctions lists. If a transfer requires additional verification, ClariSend will request specific documents and explain why they're needed. Verification happens before your money is sent, not while it's in transit.",
        ],
      },
      support: {
        label: "",
        title: "Support",
        paragraphs: [
          "Contact support when you need to cancel a transfer, update recipient information, or understand why a transfer is delayed. Support agents can see your transfer timeline, payment status, and any holds or verification requirements.",
          "Most issues are resolved in the first conversation because the support agent has the same information you see in the app, plus backend details about partner bank processing. They don't need to ask other teams for updates.",
          "If a transfer is stuck at the partner bank, ClariSend support contacts the partner directly and updates you with specific information, not generic status messages. You'll know what the partner bank is doing and when they expect to resolve the issue.",
        ],
      },
      cta: {
        title: "Send your first transfer and see what clarity feels like.",
        button: "Start a transfer",
      },
    },
    fr: {
      hero: {
        title: "Envoyez avec clarté.",
        description:
          "Une expérience simple pour comprendre les frais, suivre le statut, et savoir quand l'argent arrive.",
        primaryCta: "Commencer un transfert",
        secondaryCta: "Voir les frais",
        cardTitle: "Suivi du transfert",
        cardItems: [
          "Confirme",
          "Paiement recu",
          "Envoye a la banque partenaire",
          "Recu par la banque partenaire",
          "Pret pour le destinataire",
        ],
      },
      problem: {
        label: "Probleme",
        title: "Les transferts devraient etre clairs du debut a la fin.",
        paragraphs: [
          "Frais et taux doivent etre visibles avant la confirmation.",
          "Le statut doit evoluer avec des etapes precises et datees.",
          "Le support doit avoir le contexte complet pour agir vite.",
        ],
      },
      difference: {
        label: "",
        title: "Pourquoi ClariSend",
        items: [
          {
            title: "Frais regroupes",
            description: "Un montant total avant de payer, sans ligne cachee.",
          },
          {
            title: "Statuts explicites",
            description: "Des etapes precises avec heure et progression.",
          },
          {
            title: "Destinataires informes",
            description: "Messages en langue locale avec instructions utiles.",
          },
          {
            title: "Support contextualise",
            description: "Acces direct aux details du transfert.",
          },
        ],
      },
      howItWorks: {
        label: "",
        title: "Comment ca marche",
        steps: [
          {
            title: "Etape 1: Voir le cout total",
            description: "Taux, frais, et montant recu avant validation.",
          },
          {
            title: "Etape 2: Confirmer et envoyer",
            description: "Paiement confirme et notification immediate au destinataire.",
          },
          {
            title: "Etape 3: Suivre le transfert",
            description: "Chaque etape s'affiche avec un horodatage.",
          },
          {
            title: "Etape 4: Reception",
            description: "Instructions claires pour retrait ou depot.",
          },
        ],
      },
      transparency: {
        label: "",
        title: "Transparence",
        paragraphs: [
          "Le taux et les frais sont confirmes avant validation.",
          "Le total affiche inclut tous les couts essentiels.",
          "Aucune demande tardive apres confirmation.",
        ],
      },
      tracking: {
        label: "",
        title: "Suivi du transfert",
        stagesTitle:
          "Cinq etapes visibles avec horodatage automatique.",
        paragraphs: [
          "Le statut est consultable dans l'app ou sur le web.",
          "Les notifications previennent lorsque le statut change.",
        ],
      },
      recipient: {
        label: "",
        title: "Experience destinataire",
        paragraphs: [
          "Message local avec montant, disponibilite, et mode de retrait.",
          "Confirmation pour depot ou lieu de retrait pour cash.",
          "Reponses gerees par le support local avec le contexte.",
        ],
      },
      trust: {
        label: "",
        title: "Confiance & Securite",
        paragraphs: [
          "Fonds separes et conserves chez des institutions reglementees.",
          "Remboursement integral en cas d'echec.",
          "Verification AML/KYC avant envoi des fonds.",
        ],
      },
      support: {
        label: "",
        title: "Support",
        paragraphs: [
          "Annulation, mise a jour, ou statut: tout est visible.",
          "Resolution rapide avec acces aux details complets.",
          "Contact direct des partenaires si un blocage survient.",
        ],
      },
      cta: {
        title: "Envoyez un premier transfert avec clarte.",
        button: "Commencer un transfert",
      },
    },
  };

  const t = content[validLocale];
  const appLocaleUrl = `https://app.clarisend.co/${validLocale}`;

  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-emerald-50/30" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mt-6 mb-6">
                {t.hero.title}
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
                {t.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <TrackedLink
                  href={appLocaleUrl}
                  event="cta_start_transfer"
                  className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3.5 rounded-lg"
                >
                  {t.hero.primaryCta}
                </TrackedLink>
                <TrackedLink
                  href={`/${validLocale}/pricing`}
                  event="cta_view_fees"
                  className="inline-flex items-center justify-center text-slate-700 hover:text-slate-900 font-medium px-6 py-3.5 rounded-lg border border-slate-200 hover:border-slate-300"
                >
                  {t.hero.secondaryCta}
                </TrackedLink>
              </div>
            </div>
            <div className="w-full max-w-lg">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <p className="text-sm text-slate-500">{t.hero.cardTitle}</p>
                <div className="space-y-3">
                  {t.hero.cardItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between text-sm text-slate-600 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                    >
                      <span>{item}</span>
                      <span className="text-emerald-600 font-medium">●</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-sm text-emerald-700 font-medium">
                    {validLocale === "en"
                      ? "Each stage updates in real time with a timestamp."
                      : "Chaque etape se met a jour avec un horodatage."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.problem.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.problem.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-6">
              {t.problem.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mt-10">
            {t.problem.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-slate-600 leading-relaxed text-base">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Difference */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.difference.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.difference.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-12">
              {t.difference.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {t.difference.items.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.howItWorks.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.howItWorks.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-10">
              {t.howItWorks.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {t.howItWorks.steps.map((step) => (
              <div
                key={step.title}
                className="border border-slate-200 rounded-2xl p-6 lg:p-8 bg-slate-50"
              >
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.transparency.label ? (
              <p className="text-sm font-semibold text-emerald-300 uppercase tracking-[0.2em]">
                {t.transparency.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-10">
              {t.transparency.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {t.transparency.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-slate-200 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Transfer tracking */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12">
            <div>
              {t.tracking.label ? (
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                  {t.tracking.label}
                </p>
              ) : null}
              <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-6">
                {t.tracking.title}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                {t.tracking.stagesTitle}
              </p>
              <div className="space-y-4">
                {t.tracking.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-slate-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 lg:p-8">
              <div className="space-y-4">
                {t.hero.cardItems.map((stage, index) => (
                  <div key={stage} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">{stage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipient experience */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.recipient.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.recipient.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-8">
              {t.recipient.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {t.recipient.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.trust.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.trust.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-8">
              {t.trust.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {t.trust.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {t.support.label ? (
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
                {t.support.label}
              </p>
            ) : null}
            <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-8">
              {t.support.title}
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {t.support.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
            {t.cta.title}
          </h2>
          <TrackedLink
            href={appLocaleUrl}
            event="cta_primary_footer"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-3.5 rounded-lg"
          >
            {t.cta.button}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
