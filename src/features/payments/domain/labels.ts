import type {
  CardBrand,
  MethodType,
  PaymentStatus,
  SortKey,
  Wallet,
} from "./types";

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  succeeded: "Succeeded",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  canceled: "Canceled",
  blocked: "Blocked",
  disputed: "Disputed",
  uncaptured: "Uncaptured",
};

export const METHOD_LABELS: Record<MethodType, string> = {
  card: "Card",
  ach: "ACH",
  wallet: "Wallet",
};

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
};

export const WALLET_LABELS: Record<Wallet, string> = {
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  link: "Link",
};

export const SORT_LABELS: Record<SortKey, string> = {
  date: "Date",
  amount: "Amount",
  status: "Status",
};
