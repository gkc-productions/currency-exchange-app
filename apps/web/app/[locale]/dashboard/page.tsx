import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getServerAuthSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatRow } from "@/components/ui/StatRow";
import FirstTransferChecklist from "@/app/[locale]/(app)/_components/FirstTransferChecklist";

const statusStyles: Record<string, string> = {
  READY: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELED: "bg-slate-200 text-slate-700",
  DRAFT: "bg-slate-200 text-slate-700",
  EXPIRED: "bg-slate-200 text-slate-700",
};

export default async function DashboardPage({
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

  const transfers = await prisma.transfer.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      quote: {
        include: {
          fromAsset: { select: { code: true, decimals: true } },
          toAsset: { select: { code: true, decimals: true } },
        },
      },
    },
  });
  const recipientsCount = await prisma.recipient.count({
    where: { userId: user.id },
  });

  const statusLabels: Record<string, string> = {
    READY: messages.statusReadyLabel,
    PROCESSING: messages.statusProcessingLabel,
    COMPLETED: messages.statusCompletedLabel,
    FAILED: messages.statusFailedLabel,
    CANCELED: messages.statusCanceledLabel,
    DRAFT: messages.statusDraftLabel,
    EXPIRED: messages.statusExpiredLabel,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <SectionHeader
        eyebrow={messages.dashboardTitle}
        title={messages.dashboardTitle}
        subtitle={messages.dashboardSubtitle}
        action={
          <Button href={`/${validLocale}/recipients`} variant="secondary">
            {messages.recipientsTitle}
          </Button>
        }
      />
      <FirstTransferChecklist
        locale={validLocale}
        hasTransfers={transfers.length > 0}
        hasRecipients={recipientsCount > 0}
      />

      <div className="mt-10 grid gap-4">
        {transfers.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              {messages.dashboardEmptyTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {messages.dashboardEmptyDescription}
            </p>
            <Button href={`/${validLocale}#send`} variant="primary" className="mt-4">
              {messages.navGetStartedLabel}
            </Button>
          </Card>
        ) : (
          transfers.map((transfer) => (
            <Card key={transfer.id} className="transition hover:border-slate-300">
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/${validLocale}/transfer/${transfer.id}`}
                      className="font-mono text-base font-semibold text-slate-900"
                    >
                      {transfer.referenceCode}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {transfer.quote.fromAsset.code} → {transfer.quote.toAsset.code}
                      {" · "}
                      {formatDateTime(transfer.createdAt.toISOString(), validLocale)}
                    </p>
                  </div>
                  <Badge
                    className={statusStyles[transfer.status] ?? "bg-slate-200 text-slate-700"}
                  >
                    {statusLabels[transfer.status] ?? transfer.status}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatRow
                    label={messages.sendAmountRow}
                    value={formatMoney(
                      Number(transfer.quote.sendAmount),
                      transfer.quote.fromAsset.code,
                      validLocale,
                      transfer.quote.fromAsset.decimals
                    )}
                  />
                  <StatRow
                    label={messages.totalFeeRow}
                    value={formatMoney(
                      Number(transfer.quote.totalFee),
                      transfer.quote.fromAsset.code,
                      validLocale,
                      transfer.quote.fromAsset.decimals
                    )}
                  />
                  <StatRow
                    label={messages.recipientGetsLabel}
                    value={formatMoney(
                      Number(transfer.quote.recipientGets),
                      transfer.quote.toAsset.code,
                      validLocale,
                      transfer.quote.toAsset.decimals
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
