"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

interface DialogContentProps extends ComponentProps<
  typeof RadixDialog.Content
> {
  title: string;
  children: ReactNode;
}

/** Modal with a focus trap, Escape to close and a titled header (Radix handles the a11y wiring). */
export function DialogContent({
  title,
  children,
  className,
  ...props
}: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-[rgba(48,49,61,0.4)]" />
      <RadixDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[530px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-white text-body text-ink shadow-[0_15px_35px_rgba(48,49,61,0.3)] outline-none",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between px-[13px] pt-[13px]">
          <RadixDialog.Title className="text-[15px] font-semibold text-ink-strong">
            {title}
          </RadixDialog.Title>
          <RadixDialog.Close
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-md text-icon hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            <X aria-hidden size={16} />
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogDescription = RadixDialog.Description;
