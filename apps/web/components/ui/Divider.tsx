import { cn } from "@/components/ui/cn";

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-neutral-200 dark:bg-neutral-800", className)}
      aria-hidden="true"
    />
  );
}
