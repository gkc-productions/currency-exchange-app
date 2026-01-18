import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import RecipientsManager, { type RecipientSummary } from "@/components/RecipientsManager";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            {messages.recipientsTitle}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {messages.recipientsTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {messages.recipientsSubtitle}
          </p>
        </div>
        <Link
          href={`/${validLocale}/dashboard`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300"
        >
          {messages.navDashboardLabel}
        </Link>
      </div>

      <div className="mt-10">
        <RecipientsManager locale={validLocale} initialRecipients={initialRecipients} />
      </div>
    </div>
  );
}
