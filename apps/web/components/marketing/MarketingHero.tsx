import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type MarketingHeroProps = {
  locale: "en" | "fr";
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function MarketingHero({ locale, title, subtitle, children }: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#def7ec_0%,_#eef5ff_48%,_#ffffff_100%)]">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 bottom-4 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            ClariSend
          </span>
          <h1 className="font-[var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-lg text-slate-600">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              href={`/${locale}#send`}
              variant="primary"
              className="px-5 py-2.5 text-sm font-semibold"
            >
              Start a quote
            </Button>
            <Button
              href={`/${locale}/login`}
              variant="secondary"
              className="px-5 py-2.5 text-sm font-semibold"
            >
              Sign in
            </Button>
          </div>
        </div>
        <div data-testid="marketing-hero-quote-widget">{children}</div>
      </div>
    </section>
  );
}
