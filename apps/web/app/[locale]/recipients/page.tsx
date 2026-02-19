import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import RecipientsManager, { type RecipientSummary } from "@/components/RecipientsManager";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default async function RecipientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = locale === "fr" ? "fr" : "en";
  const messages = getMessages(validLocale);
  const session = await getServerAuthSession();

  if (!session?.user?.email) {
    redirect(`/${validLocale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect(`/${validLocale}/login`);
  }

  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const initialRecipients: RecipientSummary[] = recipients.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    country: recipient.country,
    rail: recipient.rail,
    bankName: recipient.bankName,
    bankAccount: recipient.bankAccount,
    mobileMoneyProvider: recipient.mobileMoneyProvider,
    mobileMoneyNumber: recipient.mobileMoneyNumber,
    lightningInvoice: recipient.lightningInvoice,
    createdAt: recipient.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <SectionHeader
        eyebrow={messages.recipientsTitle}
        title={messages.recipientsTitle}
        subtitle={messages.recipientsSubtitle}
        action={
          <Button href={`/${validLocale}/dashboard`} variant="secondary">
            {messages.navDashboardLabel}
          </Button>
        }
      />

      <Card className="mt-10">
        <CardContent>
        <RecipientsManager locale={validLocale} initialRecipients={initialRecipients} />
        </CardContent>
      </Card>
    </div>
  );
}
