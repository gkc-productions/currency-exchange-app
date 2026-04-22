import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children: ReactNode }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      : tone === "warning"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        : tone === "info"
          ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
          : tone === "danger"
            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClass, className)}
      {...props}
    >
      {children}
    </span>
  );
}
