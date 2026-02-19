import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Locale } from "@/src/lib/i18n/messages";

export default function FeesPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Frais",
          title: "Tarification transparente",
          subtitle:
            "ClariSend affiche clairement le taux, la marge FX et les frais avant toute validation.",
          points: [
            "Taux du marche et taux applique visibles avant verrouillage.",
            "Frais fixes et en pourcentage affiches separement.",
            "Aucun frais cache au moment du paiement.",
          ],
          cta: "Demarrer un devis",
        }
      : {
          eyebrow: "Fees",
          title: "Transparent pricing",
          subtitle:
            "ClariSend shows the live rate, FX margin, and fees before you confirm.",
          points: [
            "Market rate and applied rate visible before you lock.",
            "Fixed and percentage fees listed separately.",
            "No hidden charges at payout.",
          ],
          cta: "Start a quote",
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
      <Button href={`/${locale}#send`} variant="primary" className="mt-10">
        {content.cta}
      </Button>
    </div>
  );
}
