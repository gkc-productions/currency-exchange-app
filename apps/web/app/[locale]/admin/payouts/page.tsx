import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import AdminPayoutsTable from "@/app/[locale]/admin/payouts/AdminPayoutsTable";

type AdminPayoutRow = {
  id: string;
  referenceCode: string;
  status: string;
  payoutRail: string;
  updatedAt: Date;
  receiptUrl: string | null;
  providerPayoutProvider: string | null;
  providerPayoutStatus: string | null;
  latestPayoutEvent: {
    type: string;
    message: string;
    createdAt: Date;
  } | null;
};

export default async function AdminPayoutsPage({
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

  if (!isAdminSession(session)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8">
          <h1 className="text-2xl font-semibold text-rose-700">
            {messages.adminUnauthorizedTitle}
          </h1>
          <p className="mt-2 text-sm text-rose-700">
            {messages.adminUnauthorizedDescription}
          </p>
        </div>
      </div>
    );
  }

  const rows = await prisma.transfer.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      referenceCode: true,
      status: true,
      payoutRail: true,
      updatedAt: true,
      receiptUrl: true,
      providerPayoutProvider: true,
      providerPayoutStatus: true,
      events: {
        where: { type: { startsWith: "PAYOUT_" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          type: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  const payouts: AdminPayoutRow[] = rows.map((row) => {
    const latestEvent = row.events[0] ?? null;
    return {
      id: row.id,
      referenceCode: row.referenceCode,
      status: row.status,
      payoutRail: row.payoutRail,
      updatedAt: row.updatedAt,
      receiptUrl: row.receiptUrl,
      providerPayoutProvider: row.providerPayoutProvider ?? null,
      providerPayoutStatus: row.providerPayoutStatus ?? null,
      latestPayoutEvent: latestEvent
        ? {
            type: latestEvent.type,
            message: latestEvent.message,
            createdAt: latestEvent.createdAt,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
        {messages.adminTitle}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {messages.adminPayoutsTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {messages.adminPayoutsSubtitle}
      </p>
      <AdminPayoutsTable
        locale={validLocale}
        messages={messages}
        initialPayouts={payouts}
      />
    </div>
  );
}
