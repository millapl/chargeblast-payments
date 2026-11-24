import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { StripeIcon } from "@/shared/ui/StripeIcon";
import type { StripeIconName } from "@/shared/ui/stripe-icon-data";
import { AccountMenu } from "./AccountMenu";

/** Stripe icon, or a clock for entries whose Dashboard icon could not be extracted. */
type NavIcon = StripeIconName | "clock";

interface NavEntry {
  label: string;
  icon: NavIcon;
  href?: string;
  expandable?: boolean;
}

const PRIMARY: NavEntry[] = [
  { label: "Home", icon: "home" },
  { label: "Balances", icon: "balances" },
  { label: "Transactions", icon: "transactions", href: "/payments" },
  { label: "Customers", icon: "customers" },
  { label: "Product catalog", icon: "catalog" },
];

const SHORTCUTS: NavEntry[] = [
  { label: "Payments analytics", icon: "pin" },
  { label: "Reports", icon: "clock" },
  { label: "Sigma", icon: "clock" },
  { label: "Radar", icon: "clock" },
];

const PRODUCTS: NavEntry[] = [
  { label: "Connect", icon: "connect", expandable: true },
  { label: "Payments", icon: "payments", expandable: true },
  { label: "Billing", icon: "billing", expandable: true },
  { label: "Reporting", icon: "reporting", expandable: true },
  { label: "More", icon: "more", expandable: true },
];

const ITEM_CLASS =
  "group flex h-[29px] w-full items-center gap-[11px] rounded-md px-[8.4px] text-left text-[13.5px] hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-text";

function NavItem({ entry, current }: { entry: NavEntry; current?: boolean }) {
  const iconClass = cn("shrink-0", current ? "text-accent-text" : "text-icon");
  const content = (
    <>
      {entry.icon === "clock" ? (
        <Clock aria-hidden size={16} strokeWidth={2} className={iconClass} />
      ) : (
        <StripeIcon name={entry.icon} size={16} className={iconClass} />
      )}
      <span className="flex-1 truncate">{entry.label}</span>
      {entry.expandable && (
        <StripeIcon name="chevron" size={9} className="shrink-0 text-icon" />
      )}
    </>
  );
  const className = cn(
    ITEM_CLASS,
    current ? "font-semibold text-accent-text" : "text-ink",
  );

  if (entry.href) {
    return (
      <Link
        href={entry.href}
        aria-current={current ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
}

function Section({ title, entries }: { title?: string; entries: NavEntry[] }) {
  return (
    <div>
      {title && (
        <h2 className="mb-[2.5px] px-1 text-xs font-medium text-muted">
          {title}
        </h2>
      )}
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.label}>
            <NavItem entry={entry} current={entry.href === "/payments"} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SidebarNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Main"
      className={cn("flex flex-col gap-[33px]", className)}
    >
      <Section entries={PRIMARY} />
      <Section title="Shortcuts" entries={SHORTCUTS} />
      <Section title="Products" entries={PRODUCTS} />
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-[226.5px] shrink-0 flex-col border-r border-line max-lg:hidden">
      <div className="px-2.5 pt-3.5 pb-[28px]">
        <AccountMenu />
      </div>

      <SidebarNav className="flex-1 overflow-y-auto px-2.5 pb-3" />

      <div className="px-2.5 pb-3">
        <NavItem entry={{ label: "Developers", icon: "developers" }} />
      </div>
    </aside>
  );
}
