import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getServerAuthSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

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
    include: {
      quote: {
        include: {
          fromAsset: { select: { code: true, decimals: true } },
          toAsset: { select: { code: true, decimals: true } },
        },
      },
    },
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            {messages.dashboardTitle}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {messages.dashboardTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {messages.dashboardSubtitle}
          </p>
        </div>
        <Link
          href={`/${validLocale}/recipients`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300"
        >
          {messages.recipientsTitle}
        </Link>
      </div>

      <div className="mt-10 grid gap-4">
        {transfers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              {messages.dashboardEmptyTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {messages.dashboardEmptyDescription}
            </p>
            <Link
              href={`/${validLocale}#send`}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white"
            >
              {messages.navGetStartedLabel}
            </Link>
          </div>
        ) : (
          transfers.map((transfer) => (
            <Link
              key={transfer.id}
              href={`/${validLocale}/transfer/${transfer.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {transfer.quote.fromAsset.code} → {transfer.quote.toAsset.code}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(transfer.createdAt.toISOString(), validLocale)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                    statusStyles[transfer.status] ?? "bg-slate-200 text-slate-700"
                  }`}
                >
                  {statusLabels[transfer.status] ?? transfer.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {messages.sendAmountRow}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatMoney(
                      Number(transfer.quote.sendAmount),
                      transfer.quote.fromAsset.code,
                      validLocale,
                      transfer.quote.fromAsset.decimals
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {messages.totalFeeRow}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatMoney(
                      Number(transfer.quote.totalFee),
                      transfer.quote.fromAsset.code,
                      validLocale,
                      transfer.quote.fromAsset.decimals
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {messages.recipientGetsLabel}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatMoney(
                      Number(transfer.quote.recipientGets),
                      transfer.quote.toAsset.code,
                      validLocale,
                      transfer.quote.toAsset.decimals
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
