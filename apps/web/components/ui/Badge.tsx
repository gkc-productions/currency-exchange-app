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
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warning"
        ? "bg-amber-100 text-amber-800"
        : tone === "info"
          ? "bg-sky-100 text-sky-800"
          : tone === "danger"
            ? "bg-rose-100 text-rose-800"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClass, className)}
      {...props}
    >
      {children}
    </span>
  );
}
