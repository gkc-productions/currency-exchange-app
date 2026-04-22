import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type Tone = "info" | "warning" | "success";

export function Callout({
  tone = "info",
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; children: ReactNode }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200";

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClass, className)} {...props}>
      {children}
    </div>
  );
}
