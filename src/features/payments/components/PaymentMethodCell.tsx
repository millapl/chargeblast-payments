import { Landmark } from "lucide-react";
import { BRAND_LABELS, WALLET_LABELS } from "../domain/labels";
import type { PaymentMethod } from "../domain/types";
import { BrandIcon, WalletIcon } from "./BrandIcons";

function describe(method: PaymentMethod): string {
  switch (method.type) {
    case "card":
      return `${BRAND_LABELS[method.brand]} card ending in ${method.last4}`;
    case "wallet":
      return `${WALLET_LABELS[method.wallet]}, ${BRAND_LABELS[method.brand]} card ending in ${method.last4}`;
    case "ach":
      return `ACH bank account at ${method.bankName} ending in ${method.last4}`;
  }
}

export function PaymentMethodCell({ method }: { method: PaymentMethod }) {
  return (
    <span className="inline-flex items-center">
      {/* Fixed-width slot: rows without a wallet keep the brand icon aligned with the others. */}
      <span className="flex w-5 shrink-0 justify-center">
        {method.type === "wallet" && <WalletIcon wallet={method.wallet} />}
      </span>
      <span className="ml-1 flex shrink-0 items-center">
        {method.type === "ach" ? (
          <Landmark
            aria-hidden
            size={16}
            strokeWidth={1.75}
            className="text-icon"
          />
        ) : (
          <BrandIcon brand={method.brand} />
        )}
      </span>
      <span className="sr-only">{describe(method)}</span>
      <span
        aria-hidden
        className="ml-2.5 inline-flex items-center gap-1.5 text-[#424551] tabular-nums"
      >
        <span className="inline-flex gap-[3.3px]">
          {[0, 1, 2, 3].map((dot) => (
            <span key={dot} className="size-[3px] rounded-full bg-current" />
          ))}
        </span>
        {method.last4}
      </span>
    </span>
  );
}
