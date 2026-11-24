"use client";

import { Menu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";
import { SidebarNav } from "./Sidebar";

export function MobileNav() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent-text lg:hidden"
        >
          <Menu aria-hidden size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[80dvh] w-[260px] overflow-y-auto p-2 lg:hidden">
        <SidebarNav />
      </PopoverContent>
    </Popover>
  );
}
