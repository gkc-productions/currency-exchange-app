import Link from "next/link";

const COPY = {
  en: {
    hero: {
      label: "HERO SECTION",
      title: "Send money home without the anxiety.",
      subtitle:
        "Most remittance apps compete on speed or price, then leave you guessing what actually happened. ClariSend shows you exactly what you're paying, where your money is, and when it will arrive.",
    },
    trustStrip: [
      "Upfront pricing",
      "Live tracking",
      "Recipient SMS",
      "Human support",
    ],
    problem: {
      title: "PROBLEM STATEMENT",
      paragraphs: [
        "You send money home every month, and every month it's the same frustration. You see one exchange rate when you start, another when you confirm, and the amount your family receives never quite matches what you expected. The fees are split across multiple line items with vague labels, and you're never sure if you're seeing the full cost.",
        "After you send, the app goes quiet. You get a generic \"processing\" message that stays unchanged for days. Your family calls asking when the money will arrive, and you have no answer. You check the app again and see the same status. No one tells you what's actually happening.",
        "When something does go wrong, support can't see your transfer details. You repeat your confirmation number multiple times. They ask you to send screenshots. They promise to \"escalate\" your issue. Days pass. The money is somewhere in the system, but no one can tell you where or why it's stuck.",
      ],
    },
    different: {
      title: "HOW CLARISEND IS DIFFERENT",
      items: [
        {
          title: "Hidden fees",
          body: "ClariSend shows you the total cost before you confirm. One number that includes the transfer fee, the exchange rate markup, and any intermediary charges. What you see is what you pay.",
        },
        {
          title: "Vague status updates",
          body: "Every transfer has a timeline with specific stages: confirmed, sent to partner bank, received by partner bank, ready for pickup or deposit. Each stage updates in real time with a timestamp. You always know where your money is.",
        },
        {
          title: "Recipients don't know what's happening",
          body: "ClariSend sends your recipient a text message when you initiate the transfer, another when funds are ready, and instructions for pickup or deposit. They're informed in their language before they ask you.",
        },
        {
          title: "Support can't see your transfer",
          body: "When you contact ClariSend support, the agent sees your full transfer history, current status, and transaction details. They don't need screenshots or repeated explanations. They can resolve issues without escalation loops.",
        },
      ],
    },
    howItWorks: {
      title: "HOW IT WORKS",
      steps: [
        {
          title: "Step 1: See the full cost",
          body: "Enter the amount you want to send. ClariSend shows you the exchange rate, all fees, and the exact amount your recipient will receive. This quote is locked for 30 minutes.",
        },
        {
          title: "Step 2: Confirm and send",
          body: "Choose your payment method and confirm. Your recipient gets a text message immediately with an estimated arrival time and instructions.",
        },
        {
          title: "Step 3: Track your transfer",
          body: "Watch your transfer move through each stage. You'll see when ClariSend receives your funds, when they're sent to the partner bank, and when they're ready for your recipient.",
        },
        {
          title: "Step 4: Your recipient gets paid",
          body: "Your recipient receives a text with pickup or deposit instructions. If they have questions, the message includes a reference number and local support contact.",
        },
      ],
    },
    transparency: {
      title: "TRANSPARENCY SECTION",
      paragraphs: [
        "ClariSend locks your exchange rate and fees when you confirm your transfer. If the rate changes while you're entering your information, you'll see the update before you pay. There are no post-confirmation adjustments.",
        "The total cost you see includes everything: the transfer fee, the difference between the market rate and the rate you're getting, and any charges from partner banks or payment networks. ClariSend doesn't hide markup in the exchange rate and claim zero fees.",
        "If your transfer requires additional information or documentation to complete, ClariSend will tell you before you pay, not after. You won't confirm a transfer only to find out later that it can't be processed.",
      ],
    },
    tracking: {
      title: "TRANSFER TRACKING",
      paragraphs: [
        "Your transfer has five stages: Confirmed, Payment Received, Sent to Partner Bank, Received by Partner Bank, and Ready for Recipient. Each stage shows a timestamp and updates automatically.",
        "You can check status anytime in the app or on the web. If a transfer is delayed, you'll see why. Common reasons include bank holidays, recipient information that needs verification, or holds required by local regulations. ClariSend shows you the specific reason and what happens next.",
        "You don't have to wonder if checking the app will give you new information. If the status has changed, you'll get a notification. If it hasn't changed, the app will tell you when to expect the next update.",
      ],
      stages: [
        "Confirmed",
        "Payment Received",
        "Sent to Partner Bank",
        "Received by Partner Bank",
        "Ready for Recipient",
      ],
    },
    recipient: {
      title: "RECIPIENT EXPERIENCE",
      paragraphs: [
        "When you send money, your recipient gets a text message in their local language. The message tells them how much they're receiving, when it will be available, and how to collect it.",
        "If the money is being deposited directly, the message confirms the account number and expected deposit time. If it's a cash pickup, the message includes the pickup location, required ID, and a reference number.",
        "Recipients can reply to the message if they have questions. Responses go to local support staff who can see the transfer details and help resolve issues without asking the recipient to contact you first.",
      ],
    },
    trust: {
      title: "TRUST & SAFETY",
      paragraphs: [
        "ClariSend holds your funds in segregated accounts at regulated financial institutions. Your money is separated from ClariSend's operating funds and can only be used to complete your transfer.",
        "If a transfer cannot be completed, ClariSend refunds the full amount you paid, including all fees. Refunds are processed to your original payment method within 3-5 business days.",
        "Every transfer is monitored for compliance with anti-money laundering regulations and sanctions lists. If a transfer requires additional verification, ClariSend will request specific documents and explain why they're needed. Verification happens before your money is sent, not while it's in transit.",
      ],
      bullets: [
        "ClariSend holds your funds in segregated accounts at regulated financial institutions.",
        "If a transfer cannot be completed, ClariSend refunds the full amount you paid, including all fees.",
      ],
    },
    support: {
      title: "SUPPORT",
      paragraphs: [
        "Contact support when you need to cancel a transfer, update recipient information, or understand why a transfer is delayed. Support agents can see your transfer timeline, payment status, and any holds or verification requirements.",
        "Most issues are resolved in the first conversation because the support agent has the same information you see in the app, plus backend details about partner bank processing. They don't need to ask other teams for updates.",
        "If a transfer is stuck at the partner bank, ClariSend support contacts the partner directly and updates you with specific information, not generic status messages. You'll know what the partner bank is doing and when they expect to resolve it.",
      ],
    },
    finalCta: {
      label: "CALL TO ACTION",
      line: "Send your first transfer and see what clarity feels like.",
    },
    buttons: {
      primary: "Start a transfer",
      secondary: "View fees",
      cta: "Send your first transfer",
    },
  },
  fr: {
    hero: {
      label: "SECTION HERO",
      title: "Envoyez de l'argent chez vous sans anxiete.",
      subtitle:
        "La plupart des applications de transfert misent sur la vitesse ou le prix, puis vous laissent deviner ce qui s'est vraiment passe. ClariSend vous montre exactement ce que vous payez, ou se trouve votre argent, et quand il arrivera.",
    },
    trustStrip: [
      "Prix clair",
      "Suivi en direct",
      "SMS destinataire",
      "Support humain",
    ],
    problem: {
      title: "PROBLEME",
      paragraphs: [
        "Vous envoyez de l'argent chez vous chaque mois, et chaque mois c'est la meme frustration. Vous voyez un taux de change au depart, un autre au moment de confirmer, et le montant recu par votre famille ne correspond jamais tout a fait a ce que vous attendiez. Les frais sont repartis sur plusieurs lignes avec des libelles vagues, et vous ne savez jamais si le cout total est complet.",
        "Apres l'envoi, l'application se tait. Vous recevez un message \"en cours\" qui ne change pas pendant des jours. Votre famille appelle pour demander quand l'argent va arriver, et vous n'avez pas de reponse. Vous ouvrez l'application et voyez le meme statut. Personne ne dit ce qui se passe vraiment.",
        "Quand quelque chose se passe mal, le support ne voit pas les details de votre transfert. Vous repetez votre numero de confirmation. On vous demande des captures d'ecran. On promet d'\"escalader\" votre demande. Les jours passent. L'argent est quelque part dans le systeme, mais personne ne peut dire ou il est bloque ou pourquoi.",
      ],
    },
    different: {
      title: "COMMENT CLARISEND FAIT LA DIFFERENCE",
      items: [
        {
          title: "Frais caches",
          body: "ClariSend affiche le cout total avant confirmation. Un seul montant qui inclut les frais de transfert, la marge sur le taux de change et toute charge intermediaire. Ce que vous voyez est ce que vous payez.",
        },
        {
          title: "Mises a jour de statut vagues",
          body: "Chaque transfert a une chronologie avec des etapes precises : confirme, envoye a la banque partenaire, recu par la banque partenaire, pret pour le retrait ou le depot. Chaque etape se met a jour en temps reel avec un horodatage. Vous savez toujours ou est votre argent.",
        },
        {
          title: "Les destinataires ne savent pas ce qui se passe",
          body: "ClariSend envoie un SMS au destinataire au demarrage du transfert, un autre quand les fonds sont prets, et les instructions pour le retrait ou le depot. Il est informe dans sa langue avant de vous demander.",
        },
        {
          title: "Le support ne voit pas votre transfert",
          body: "Quand vous contactez le support ClariSend, l'agent voit votre historique complet, le statut actuel et les details de la transaction. Pas besoin de captures d'ecran ou d'explications repetees. Les problemes se resolvent sans boucle d'escalade.",
        },
      ],
    },
    howItWorks: {
      title: "COMMENT CA MARCHE",
      steps: [
        {
          title: "Etape 1 : Voir le cout total",
          body: "Entrez le montant a envoyer. ClariSend affiche le taux de change, tous les frais, et le montant exact que le destinataire recevra. Ce devis est bloque pendant 30 minutes.",
        },
        {
          title: "Etape 2 : Confirmer et envoyer",
          body: "Choisissez votre mode de paiement et confirmez. Le destinataire recoit un SMS immediat avec un delai estime et des instructions.",
        },
        {
          title: "Etape 3 : Suivre le transfert",
          body: "Suivez chaque etape. Vous verrez quand ClariSend recoit vos fonds, quand ils sont envoyes a la banque partenaire, et quand ils sont prets pour le destinataire.",
        },
        {
          title: "Etape 4 : Le destinataire est paye",
          body: "Le destinataire recoit un SMS avec les instructions de retrait ou de depot. Si besoin, le message inclut un numero de reference et un contact support local.",
        },
      ],
    },
    transparency: {
      title: "TRANSPARENCE",
      paragraphs: [
        "ClariSend verrouille votre taux de change et vos frais au moment de la confirmation. Si le taux change pendant la saisie, vous verrez la mise a jour avant de payer. Pas d'ajustements apres confirmation.",
        "Le cout total inclut tout : les frais de transfert, l'ecart entre le taux du marche et votre taux, et les frais des banques partenaires ou des reseaux de paiement. ClariSend ne cache pas la marge dans le taux et ne pretent pas a zero frais.",
        "Si votre transfert exige des informations ou documents supplementaires, ClariSend vous le dira avant le paiement, pas apres. Vous ne confirmerez pas un transfert qui ne peut pas etre traite.",
      ],
    },
    tracking: {
      title: "SUIVI DU TRANSFERT",
      paragraphs: [
        "Votre transfert comporte cinq etapes : Confirme, Paiement recu, Envoye a la banque partenaire, Recu par la banque partenaire, et Pret pour le destinataire. Chaque etape affiche un horodatage et se met a jour automatiquement.",
        "Vous pouvez consulter le statut a tout moment dans l'application ou sur le web. En cas de retard, vous verrez pourquoi. Les causes courantes incluent les jours feries, des informations a verifier pour le destinataire, ou des blocages lies a la regulation locale. ClariSend montre la raison precise et la suite.",
        "Vous n'avez pas a esperer qu'une verification donne de nouvelles infos. Si le statut change, vous recevez une notification. Sinon, l'application vous indique quand attendre la prochaine mise a jour.",
      ],
      stages: [
        "Confirme",
        "Paiement recu",
        "Envoye a la banque partenaire",
        "Recu par la banque partenaire",
        "Pret pour le destinataire",
      ],
    },
    recipient: {
      title: "EXPERIENCE DESTINATAIRE",
      paragraphs: [
        "Quand vous envoyez de l'argent, le destinataire recoit un SMS dans sa langue. Le message indique le montant recu, quand il sera disponible, et comment le recuperer.",
        "Si l'argent est depose directement, le message confirme le numero de compte et l'heure de depot attendue. S'il s'agit d'un retrait cash, le message donne le lieu, la piece d'identite requise et un numero de reference.",
        "Les destinataires peuvent repondre au message en cas de question. Les reponses vont a un support local qui voit les details du transfert et peut aider sans demander au destinataire de vous contacter d'abord.",
      ],
    },
    trust: {
      title: "CONFIANCE ET SECURITE",
      paragraphs: [
        "ClariSend conserve vos fonds dans des comptes separes au sein d'institutions financieres regulees. Votre argent est separe des fonds de fonctionnement de ClariSend et ne sert qu'a executer votre transfert.",
        "Si un transfert ne peut pas etre complete, ClariSend rembourse le montant total paye, frais inclus. Les remboursements sont effectues sur votre moyen de paiement d'origine sous 3 a 5 jours ouvrables.",
        "Chaque transfert est controle selon les regles de lutte contre le blanchiment et les listes de sanctions. Si une verification est requise, ClariSend demande des documents precis et explique pourquoi. La verification se fait avant l'envoi des fonds, pas pendant le transit.",
      ],
      bullets: [
        "ClariSend conserve vos fonds dans des comptes separes au sein d'institutions financieres regulees.",
        "Si un transfert ne peut pas etre complete, ClariSend rembourse le montant total paye, frais inclus.",
      ],
    },
    support: {
      title: "SUPPORT",
      paragraphs: [
        "Contactez le support si vous devez annuler un transfert, mettre a jour les informations du destinataire, ou comprendre un retard. Les agents voient votre chronologie, le statut du paiement, et tout blocage ou verification.",
        "La plupart des problemes sont resolus au premier echange car l'agent voit les memes informations que vous, plus les details de traitement des banques partenaires. Il n'a pas besoin de demander des mises a jour a d'autres equipes.",
        "Si un transfert est bloque a la banque partenaire, le support ClariSend contacte directement le partenaire et vous tient informe avec des details precis, pas des messages generiques. Vous saurez ce que fait la banque partenaire et quand elle compte resoudre.",
      ],
    },
    finalCta: {
      label: "APPEL A L'ACTION",
      line: "Envoyez votre premier transfert et voyez ce que la clarte change.",
    },
    buttons: {
      primary: "Commencer un transfert",
      secondary: "Voir les frais",
      cta: "Envoyer un premier transfert",
    },
  },
} as const;

const container = "mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8";

export default async function MarketingHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "fr" ? "fr" : "en";
  const copy = COPY[locale];
  const primaryCtaHref = `/${locale}/fees`;
  const secondaryCtaHref = `/${locale}#how-it-works`;

  return (
    <div className="bg-brand-surface text-slate-900">
      <section className="bg-white">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {copy.hero.label}
            </p>
            <div className="space-y-6">
              <h1 className="max-w-[28ch] text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                {copy.hero.title}
              </h1>
              <p className="max-w-[65ch] text-lg leading-7 text-slate-600">
                {copy.hero.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {copy.buttons.primary}
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                {copy.buttons.secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70">
        <div className={`${container} py-16 md:py-24`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.trustStrip.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-sm font-semibold text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white" id="problem">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.problem.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.problem.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70" id="different">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.different.title}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {copy.different.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white" id="how-it-works">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.howItWorks.title}
            </h2>
            <ol className="grid gap-6 sm:grid-cols-2">
              {copy.howItWorks.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70" id="transparency">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.transparency.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.transparency.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white" id="tracking">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.tracking.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.tracking.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {copy.tracking.stages.map((stage) => (
                <li
                  key={stage}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700"
                >
                  {stage}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70" id="recipient">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.recipient.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.recipient.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white" id="trust">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.trust.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.trust.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="max-w-[65ch] space-y-3 text-base leading-7 text-slate-600">
              {copy.trust.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70" id="support">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.support.title}
            </h2>
            <div className="max-w-[65ch] space-y-6 text-base leading-7 text-slate-600">
              {copy.support.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-brand-mist">
        <div className={`${container} py-16 md:py-24`}>
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              {copy.finalCta.label}
            </p>
            <h2 className="max-w-[65ch] text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              {copy.finalCta.line}
            </h2>
            <div>
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {copy.buttons.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
