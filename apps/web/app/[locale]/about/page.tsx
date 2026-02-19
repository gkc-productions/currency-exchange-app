import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Locale } from "@/src/lib/i18n/messages";

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale: Locale = params.locale === "fr" ? "fr" : "en";
  const content =
    locale === "fr"
      ? {
          eyebrow: "ClariSend",
          title: "Qui nous sommes",
          subtitle:
            "ClariSend est le produit de GKC Financial Technologies, construit pour rendre les envois internationaux plus clairs.",
          missionTitle: "Notre mission",
          missionBody:
            "Offrir des paiements transparents, avec des taux clairs, des frais visibles et des delais previsibles.",
          valuesTitle: "Ce qui nous guide",
          valuesBody:
            "Clarte, conformite et performance pour chaque transfert, dans chaque corridor.",
          cta: "Decouvrir les tarifs",
        }
      : {
          eyebrow: "ClariSend",
          title: "Who we are",
          subtitle:
            "ClariSend is the product of GKC Financial Technologies, built to make global transfers clearer.",
          missionTitle: "Our mission",
          missionBody:
            "Deliver transparent payments with clear rates, visible fees, and predictable delivery.",
          valuesTitle: "What guides us",
          valuesBody:
            "Clarity, compliance, and performance for every transfer in every corridor.",
          cta: "Explore fees",
        };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <SectionHeader
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-slate-900">{content.missionTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{content.missionBody}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-slate-900">{content.valuesTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{content.valuesBody}</p>
          </CardContent>
        </Card>
      </div>
      <Button href={`/${locale}/fees`} variant="primary" className="mt-10">
        {content.cta}
      </Button>
    </div>
  );
}
