import type { ReactNode } from "react";
import { STRIPE_VISA_PATHS } from "@/shared/ui/stripe-icon-data";
import type { CardBrand, Wallet } from "../domain/types";
import {
  AMEX_PATH,
  APPLE_PATH,
  DISCOVER_O_PATH,
  DISCOVER_TEXT_PATH,
  GOOGLE_PAY_PATH,
  MASTERCARD_LEFT_PATH,
  MASTERCARD_OVERLAP_PATH,
  MASTERCARD_RIGHT_PATH,
} from "./brand-paths";

/** Tiles are 20 × 18 CSS px, the size measured in the reference screenshot. */
function Tile({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      width={20}
      height={18}
      viewBox="0 0 20 18"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const OUTLINED = { fill: "#fff", stroke: "#dadee3" } as const;

export function BrandIcon({ brand }: { brand: CardBrand }) {
  switch (brand) {
    case "visa":
      return (
        <Tile>
          <rect width={20} height={18} rx={4} fill="#23569a" />
          <svg x={0} y={0} width={20} height={18} viewBox="0 3 32 28.8">
            {STRIPE_VISA_PATHS.map((d) => (
              <path key={d} d={d} fill="#fff" />
            ))}
          </svg>
        </Tile>
      );
    case "mastercard":
      return (
        <Tile>
          <rect width={20} height={18} rx={4} fill="#000" />
          <svg
            x={2.5}
            y={4.35}
            width={15}
            height={9.27}
            viewBox="0 4.58 24 14.83"
          >
            <path d={MASTERCARD_LEFT_PATH} fill="#eb001b" />
            <path d={MASTERCARD_RIGHT_PATH} fill="#f79e1b" />
            <path d={MASTERCARD_OVERLAP_PATH} fill="#ff5f00" />
          </svg>
        </Tile>
      );
    case "amex":
      return (
        <Tile>
          <rect width={20} height={18} rx={4} fill="#fff" />
          <svg x={1} y={0} width={18} height={18} viewBox="0 0 24 24">
            <path d={AMEX_PATH} fill="#1f72cd" />
          </svg>
        </Tile>
      );
    case "discover":
      return (
        <Tile>
          <rect x={0.5} y={0.5} width={19} height={17} rx={3.5} {...OUTLINED} />
          <svg
            x={1.2}
            y={7.5}
            width={17.6}
            height={2.97}
            viewBox="0 9.98 24 4.05"
          >
            <path d={DISCOVER_TEXT_PATH} fill="#231f20" />
            <path d={DISCOVER_O_PATH} fill="#f76f20" />
          </svg>
        </Tile>
      );
  }
}

export function WalletIcon({ wallet }: { wallet: Wallet }) {
  switch (wallet) {
    case "apple_pay":
      return (
        <Tile>
          <rect width={20} height={18} rx={4} fill="#000" />
          <svg
            x={4.3}
            y={1.8}
            width={11.4}
            height={14.4}
            viewBox="2.22 0 19.55 24"
          >
            <path d={APPLE_PATH} fill="#fff" />
          </svg>
        </Tile>
      );
    case "google_pay":
      return (
        <Tile>
          <rect x={0.5} y={0.5} width={19} height={17} rx={3.5} {...OUTLINED} />
          <svg
            x={1.8}
            y={5.75}
            width={16.4}
            height={6.51}
            viewBox="0 7.23 24 9.53"
          >
            <path d={GOOGLE_PAY_PATH} fill="#3c4043" />
          </svg>
        </Tile>
      );
    case "link":
      return (
        <Tile>
          <rect width={20} height={18} rx={4} fill="#61d37a" />
          <path d="M6.4 3.6H9.8L15 9l-5.2 5.4H6.4L10.6 9Z" fill="#081d10" />
        </Tile>
      );
  }
}
