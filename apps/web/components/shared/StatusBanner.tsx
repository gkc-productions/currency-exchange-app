import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";
import { withLocale } from "@/src/lib/with-locale";

export default function StatusBanner({ locale }: { locale: Locale }) {
  if (process.env.NEXT_PUBLIC_STATUS_BANNER !== "1") {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50/80">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm lg:px-8">
        <div className="text-slate-700">
          <p className="font-semibold text-amber-900">Service update</p>
          <p>We&apos;re improving reliability. Some actions may take longer than usual.</p>
        </div>
        <Link
          href={withLocale("/help", locale)}
          className="font-semibold text-amber-900 underline decoration-amber-400 underline-offset-2 transition hover:text-amber-950"
        >
          Learn more
        </Link>
      </div>
    </div>
  );
}
