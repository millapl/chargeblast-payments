"use client";

import { LogOut, Settings, Users } from "lucide-react";
import { StripeIcon } from "@/shared/ui/StripeIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";

const ITEM =
  "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-body text-ink hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-text";

export function AccountMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-md pr-3 pl-1 text-left hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-text data-[state=open]:bg-subtle"
        >
          <span
            aria-hidden
            className="flex size-6 items-center justify-center rounded-md bg-[#d9d0fb] text-xs font-semibold text-ink-strong"
          >
            A
          </span>
          <span className="flex-1 truncate font-semibold text-ink-strong">
            Acme Inc.
            <span className="sr-only"> account menu</span>
          </span>
          <StripeIcon name="chevron" size={9} className="shrink-0 text-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-1.5">
        <div className="px-2 pt-1.5 pb-2">
          <p className="font-semibold text-ink-strong">Acme Inc.</p>
          <p className="text-xs text-muted">demo@example.com · Test mode</p>
        </div>
        <ul className="border-t border-line pt-1">
          <li>
            <button type="button" className={ITEM}>
              <Settings aria-hidden size={14} className="text-icon" />
              Account settings
            </button>
          </li>
          <li>
            <button type="button" className={ITEM}>
              <Users aria-hidden size={14} className="text-icon" />
              Switch account
            </button>
          </li>
          <li>
            <button type="button" className={ITEM}>
              <LogOut aria-hidden size={14} className="text-icon" />
              Sign out
            </button>
          </li>
        </ul>
        <p className="mt-1 border-t border-line px-2 pt-2 pb-1 text-xs text-muted">
          Demo only: this recreation has no authentication, so these actions do
          nothing.
        </p>
      </PopoverContent>
    </Popover>
  );
}
