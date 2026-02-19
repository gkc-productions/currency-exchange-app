import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success";
type ButtonSize = "sm" | "md";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkButtonProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function baseClasses(variant: ButtonVariant, size: ButtonSize) {
  const variantClass =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : variant === "success"
        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        : variant === "ghost"
          ? "text-slate-700 hover:bg-slate-100"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300";

  const sizeClass = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";

  return cn(
    "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60",
    variantClass,
    sizeClass
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps | LinkButtonProps) {
  const classes = cn(baseClasses(variant, size), className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props as LinkButtonProps;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonProps;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
