import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

function resolveAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage({
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

  const adminEmails = resolveAdminEmails();
  const isAdmin = session.user.email
    ? adminEmails.includes(session.user.email.toLowerCase())
    : false;

  if (!isAdmin) {
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
    <div className="mx-auto w-full max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
        {messages.adminTitle}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {messages.adminTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {messages.adminSubtitle}
      </p>
    </div>
  );
}
