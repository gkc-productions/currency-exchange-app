import { redirect } from "next/navigation";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import AdminWebhookEventsTable from "@/app/[locale]/admin/webhook-events/AdminWebhookEventsTable";

export default async function AdminWebhookEventsPage({
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
        {messages.adminTitle}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {messages.adminWebhookEventsTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {messages.adminWebhookEventsSubtitle}
      </p>
      <AdminWebhookEventsTable locale={validLocale} messages={messages} />
    </div>
  );
}
