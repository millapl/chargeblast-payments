"use client";

import * as RadixPopover from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export function PopoverContent({
  className,
  children,
  ...props
}: ComponentProps<typeof RadixPopover.Content>) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          "z-40 rounded-lg border border-line bg-white p-3 text-body text-ink shadow-[0_8px_24px_rgba(48,49,61,0.14)] outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
