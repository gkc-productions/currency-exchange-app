import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}
