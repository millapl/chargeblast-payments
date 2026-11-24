import { cn } from "@/shared/lib/cn";

const TABS = [
  "Payments",
  "Payouts",
  "Top-ups",
  "Collected fees",
  "Transfers",
  "All activity",
] as const;

const ACTIVE_TAB = "Payments";

export function Tabs() {
  return (
    <nav
      aria-label="Transactions sections"
      className="mt-3 border-b border-border"
    >
      <ul className="flex flex-wrap gap-x-[23px]">
        {TABS.map((tab) => {
          const active = tab === ACTIVE_TAB;
          return (
            <li key={tab}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 pb-1.5 text-[13.5px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
                  active
                    ? "border-accent text-accent-text"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {tab}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
