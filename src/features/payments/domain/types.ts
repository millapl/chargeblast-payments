export const CURRENCIES = ["USD", "EUR", "GBP", "BRL", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PAYMENT_STATUSES = [
  "succeeded",
  "pending",
  "failed",
  "refunded",
  "canceled",
  "blocked",
  "disputed",
  "uncaptured",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const METHOD_TYPES = ["card", "ach", "wallet"] as const;
export type MethodType = (typeof METHOD_TYPES)[number];

export const CARD_BRANDS = ["visa", "mastercard", "amex", "discover"] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const WALLETS = ["apple_pay", "google_pay", "link"] as const;
export type Wallet = (typeof WALLETS)[number];

export type PaymentMethod =
  | { type: "card"; brand: CardBrand; last4: string }
  | { type: "wallet"; wallet: Wallet; brand: CardBrand; last4: string }
  | { type: "ach"; bankName: string; last4: string };

export interface Payment {
  /** `pi_` followed by 24 alphanumeric characters. */
  id: string;
  /** Integer amount in the minor unit of `currency`. */
  amountMinor: number;
  currency: Currency;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  description: string;
  method: PaymentMethod;
  /** ISO 8601 UTC timestamp. */
  createdAt: string;
  /** Set if and only if `status === "refunded"`. */
  refundedAt: string | null;
  /** Set if and only if `status` is `failed` or `blocked`. */
  declineReason: string | null;
}

/** `pi_` + 24 alphanumerics. Mirrored (by necessity) in src/proxy.ts; a test pins them together. */
export const PAYMENT_ID_PATTERN = /^pi_[A-Za-z0-9]{24}$/;

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const DATE_RANGES = [
  "all",
  "today",
  "7d",
  "30d",
  "month",
  "4w",
  "last-month",
  "custom",
] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const SORT_KEYS = ["date", "amount", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";
export interface SortSpec {
  key: SortKey;
  dir: SortDirection;
}

export const MAX_SORT_KEYS = 3;
export const MAX_SEARCH_LENGTH = 64;
