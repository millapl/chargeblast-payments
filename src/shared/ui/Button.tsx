import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary";
type Size = "md" | "sm" | "toolbar";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-[#5851e6] active:bg-[#4f48cc] disabled:bg-accent/50",
  secondary:
    "bg-white text-ink ring-1 ring-inset ring-border shadow-[0_1px_0_rgba(33,37,63,0.16)] hover:bg-subtle active:bg-line disabled:text-disabled disabled:hover:bg-white",
};

const SIZES: Record<Size, string> = {
  md: "h-7 px-[9px] text-[13.5px]",
  sm: "h-6 px-[9px] text-[12.5px]",
  toolbar: "h-7 px-2 text-[13.5px]",
};

export function buttonStyles(
  variant: Variant = "secondary",
  className?: string,
  size: Size = "md",
): string {
  return cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-md font-semibold whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:cursor-not-allowed",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, className, size)}
      {...props}
    />
  );
}
