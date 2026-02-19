import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card, CardContent } from "@/components/ui/Card";

type Locale = "en" | "fr";

const copyByLocale = {
  en: {
    title: "First transfer checklist",
    subtitle: "Complete these quick steps to launch your first transfer.",
    items: [
      "Create a transfer",
      "Add a recipient",
      "Review fees and locked rate",
      "Track status and download receipt",
    ],
    cta: "Start transfer",
    help: "Help",
  },
  fr: {
    title: "Checklist premier transfert",
    subtitle: "Terminez ces etapes rapides pour lancer votre premier transfert.",
    items: [
      "Creer un transfert",
      "Ajouter un beneficiaire",
      "Verifier les frais et le taux verrouille",
      "Suivre le statut et telecharger le recu",
    ],
    cta: "Demarrer",
    help: "Aide",
  },
} as const;

export default function FirstTransferChecklist({
  locale,
  hasTransfers,
  hasRecipients,
}: {
  locale: Locale;
  hasTransfers: boolean;
  hasRecipients: boolean;
}) {
  if (hasTransfers && hasRecipients) {
    return null;
  }

  const copy = copyByLocale[locale];
  const itemStates = [
    hasTransfers,
    hasRecipients,
    hasTransfers,
    hasTransfers,
  ];

  return (
    <Card data-testid="first-transfer-checklist" className="mt-8">
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{copy.title}</p>
        <p className="mt-2 text-sm text-slate-600">{copy.subtitle}</p>

        <div className="mt-4 space-y-2">
          {copy.items.map((item, index) => (
            <Callout key={item} tone={itemStates[index] ? "success" : "info"}>
              <span className="text-xs font-medium">{itemStates[index] ? "Done" : "Next"}</span>
              <span className="ml-2">{item}</span>
            </Callout>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={`/${locale}`} variant="primary">
            {copy.cta}
          </Button>
          <Link href={`/${locale}/help`} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
            {copy.help}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
