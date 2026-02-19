import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Locale } from "@/src/lib/i18n/messages";

export default function SecurityPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "Securite",
          title: "Protection et conformite",
          subtitle:
            "ClariSend applique des controles stricts pour proteger vos transferts et vos donnees.",
          points: [
            "Chiffrement des donnees en transit et au repos.",
            "Controles KYC/AML adaptes aux corridors pris en charge.",
            "Surveillance continue des risques et auditabilite.",
          ],
          cta: "Voir l'aide",
        }
      : {
          eyebrow: "Security",
          title: "Protection and compliance",
          subtitle:
            "ClariSend applies strict controls to protect your transfers and data.",
          points: [
            "Data encryption in transit and at rest.",
            "KYC/AML controls tailored to supported corridors.",
            "Continuous risk monitoring and auditability.",
          ],
          cta: "Visit help",
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
      <Button href={`/${locale}/help`} variant="primary" className="mt-10">
        {content.cta}
      </Button>
    </div>
  );
}
