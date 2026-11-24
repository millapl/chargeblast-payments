"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface CheckboxProps {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  ...props
}: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className={cn(
        "flex size-[15px] shrink-0 items-center justify-center rounded-sm border border-control bg-line text-white",
        "hover:border-icon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator>
        {checked === "indeterminate" ? (
          <Minus aria-hidden size={12} strokeWidth={3} />
        ) : (
          <Check aria-hidden size={12} strokeWidth={3} />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
