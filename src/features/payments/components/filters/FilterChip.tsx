"use client";

import { useState, type ReactNode } from "react";
import { CirclePlus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";

interface FilterChipProps {
  label: string;
  /** Short description of the applied value; empty when the filter is inactive. */
  summary: string;
  onClear: () => void;
  children: (close: () => void) => ReactNode;
}

export function FilterChip({
  label,
  summary,
  onClear,
  children,
}: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const active = summary !== "";

  return (
    <div
      className={cn(
        "inline-flex h-6 items-center",
        active && "rounded-full border border-solid border-icon",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-full items-center gap-[5px] px-1.5 text-xs font-medium text-muted",
              "hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
              "data-[state=open]:bg-subtle",
              active
                ? "rounded-l-full text-ink"
                : "rounded-full border border-dashed border-border",
            )}
          >
            <CirclePlus
              aria-hidden
              size={13}
              strokeWidth={2}
              className="text-muted"
            />
            {label}
            {active && (
              <>
                <span aria-hidden className="h-3 w-px bg-border" />
                <span className="max-w-[140px] truncate font-semibold text-accent-text">
                  {summary}
                </span>
                <span className="sr-only">, filter applied</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[318px]">
          {children(() => setOpen(false))}
        </PopoverContent>
      </Popover>
      {active && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label} filter`}
          className="inline-flex h-full min-w-6 items-center justify-center rounded-r-full pr-1.5 pl-1 text-icon hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <X aria-hidden size={12} strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
}
