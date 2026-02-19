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
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClass, className)} {...props}>
      {children}
    </div>
  );
}
