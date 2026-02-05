import { redirect } from "next/navigation";
import { getServerAuthSession, isAdminSession } from "@/src/lib/auth";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

type VersionInfo = {
  commitHash: string | null;
  buildTime: string | null;
  nodeEnv: string | null;
  devBypassEnabled: boolean;
  appBaseUrl: string | null;
};

export default async function AdminLaunchReadinessPage({
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

  const versionRes = await fetch(`${process.env.APP_BASE_URL ?? ""}/api/version`, {
    cache: "no-store",
  });
  const version = (await versionRes.json().catch(() => null)) as VersionInfo | null;

  const payoutProvider =
    (process.env.PAYOUT_PROVIDER ?? process.env.PAYOUT_EXECUTOR ?? "mock").toLowerCase();
  const rateProvider = process.env.RATE_PROVIDER ?? "MockRateProvider";
  const webhookSecurityEnabled = Boolean(process.env.WEBHOOK_SECRET);
  const readOnly = process.env.APP_READ_ONLY === "1";

  const rows = [
    {
      label: messages.launchReadinessRateProviderLabel,
      value: rateProvider,
    },
    {
      label: messages.launchReadinessPayoutProviderLabel,
      value: payoutProvider,
    },
    {
      label: messages.launchReadinessWebhookSecurityLabel,
      value: webhookSecurityEnabled
        ? messages.launchReadinessEnabledLabel
        : messages.launchReadinessDisabledLabel,
    },
    {
      label: messages.launchReadinessReadOnlyLabel,
      value: readOnly
        ? messages.launchReadinessEnabledLabel
        : messages.launchReadinessDisabledLabel,
    },
    {
      label: messages.launchReadinessCommitLabel,
      value: version?.commitHash ?? "—",
    },
    {
      label: messages.launchReadinessBuildTimeLabel,
      value: version?.buildTime ?? "—",
    },
    {
      label: messages.launchReadinessNodeEnvLabel,
      value: version?.nodeEnv ?? process.env.NODE_ENV ?? "—",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
        {messages.adminTitle}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {messages.launchReadinessTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {messages.launchReadinessSubtitle}
      </p>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{row.label}</span>
              <span className="text-sm font-semibold text-slate-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
