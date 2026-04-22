import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
