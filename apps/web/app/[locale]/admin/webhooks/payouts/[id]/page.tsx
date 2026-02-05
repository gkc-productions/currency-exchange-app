import { redirect } from "next/navigation";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export default async function AdminPayoutWebhookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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

  const res = await fetch(`${process.env.APP_BASE_URL ?? ""}/api/admin/webhooks/payout/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8">
          <h1 className="text-2xl font-semibold text-rose-700">
            {messages.adminWebhookEventsEmptyLabel}
          </h1>
        </div>
      </div>
    );
  }

  const payload = (await res.json().catch(() => null)) as
    | {
        id: string;
        headers: { signature: string | null; signatureRedacted: boolean; timestamp: string | null; eventId: string };
        payload: unknown;
        processing: { deduped: boolean; transferId: string; updatedStatus: string; receiptIssued: boolean };
        createdAt: string;
        updatedAt: string;
      }
    | null;

  if (!payload) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8">
          <h1 className="text-2xl font-semibold text-rose-700">
            {messages.adminWebhookEventsEmptyLabel}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
      <h1 className="text-2xl font-semibold text-slate-900">
        {messages.adminWebhookEventsDetailTitle}
      </h1>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <p><strong>{messages.adminWebhookEventsEventIdLabel}:</strong> {payload.id}</p>
        <p><strong>{messages.adminWebhookEventsTransferLabel}:</strong> {payload.processing.transferId}</p>
        <p><strong>{messages.adminWebhookEventsOutcomeLabel}:</strong> {payload.processing.updatedStatus}</p>
        <p><strong>{messages.adminWebhookEventsReceivedLabel}:</strong> {payload.createdAt}</p>
        <p><strong>Signature:</strong> {payload.headers.signature ?? "—"}</p>
      </div>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-xs text-slate-500">
          {messages.adminWebhookPayloadUnavailableLabel}
        </p>
      </div>
    </div>
  );
}
