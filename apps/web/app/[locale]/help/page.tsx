import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Locale } from "@/src/lib/i18n/messages";

export default function HelpPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Support",
          title: "Nous sommes la pour aider",
          subtitle:
            "Consultez nos ressources ou contactez l'equipe ClariSend pour obtenir de l'aide.",
          points: [
            "Centre d'aide disponible 24/7 pour les questions de transferts.",
            "Statuts en direct et confirmations envoyees automatiquement.",
            "Support prioritaire pour les corridors critiques.",
          ],
          cta: "Retour a l'accueil",
        }
      : {
          eyebrow: "Support",
          title: "We are here to help",
          subtitle:
            "Check our resources or reach the ClariSend team for assistance.",
          points: [
            "24/7 help center coverage for transfer questions.",
            "Live status updates and automated confirmations.",
            "Priority support for critical corridors.",
          ],
          cta: "Back to home",
        };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <SectionHeader
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
      />
      <div className="mt-8 grid gap-3">
        {content.points.map((point) => (
          <Card key={point}>
            <CardContent className="px-4 py-3 text-sm text-slate-700">{point}</CardContent>
          </Card>
        ))}
      </div>
      <Button href={`/${locale}`} variant="primary" className="mt-10">
        {content.cta}
      </Button>
    </div>
  );
}
