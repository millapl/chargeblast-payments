import { Suspense } from "react";
import { MobileNav } from "./MobileNav";
import { ArrowAppIcon, HexAppIcon, LdAppIcon, MoreAppsIcon } from "./AppIcons";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  SearchBox,
  SearchBoxFallback,
} from "@/features/payments/components/SearchBox";
import { StripeIcon } from "@/shared/ui/StripeIcon";

const ICON_BUTTON =
  "relative flex size-8 items-center justify-center rounded-md text-icon hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

export function Topbar() {
  return (
    <header className="flex h-[52px] items-center gap-6 max-lg:gap-2">
      <MobileNav />
      <Suspense fallback={<SearchBoxFallback />}>
        <NuqsAdapter>
          <SearchBox />
        </NuqsAdapter>
      </Suspense>

      <div className="ml-auto flex items-center gap-[11.5px]">
        <p className="mr-2 text-[13.8px] text-ink max-xl:hidden">
          Test mode has moved.{" "}
          <a
            href="#"
            className="ml-[3px] underline underline-offset-2 hover:text-ink-strong"
          >
            Show me
          </a>
        </p>
        <button
          type="button"
          aria-label="Installed apps"
          className="flex h-8 items-center gap-[15px] rounded-full border border-line px-[9px] hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent-text max-sm:hidden"
        >
          <LdAppIcon />
          <HexAppIcon />
          <ArrowAppIcon />
          <MoreAppsIcon />
        </button>
        <div className="flex items-center gap-[7px]">
          <button type="button" aria-label="Help" className={ICON_BUTTON}>
            <StripeIcon name="help" size={16} />
          </button>
          <button
            type="button"
            aria-label="Notifications, new activity"
            className={ICON_BUTTON}
          >
            <StripeIcon name="bell" size={14} />
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#0196ed]"
            />
          </button>
          <button type="button" aria-label="Settings" className={ICON_BUTTON}>
            <StripeIcon name="settings" size={16} />
          </button>
          <button
            type="button"
            aria-label="Create"
            className="ml-2 flex size-5 items-center justify-center rounded-full bg-accent text-white hover:bg-[#5851e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            <StripeIcon name="create" size={11} />
          </button>
        </div>
      </div>
    </header>
  );
}
