import { currencyExponent } from "./money";
import { STATUS_LABELS } from "./labels";
import type { Payment, PaymentMethod } from "./types";

const FORMULA_PREFIXES = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Escapes one CSV field (RFC 4180) and neutralises spreadsheet formula injection:
 * a value that would start a formula in Excel/Sheets/LibreOffice gets a leading apostrophe.
 */
export function escapeCsvField(value: string): string {
  // Only leading spaces are skipped: tab and CR are themselves formula-triggering prefixes.
  const first = value.replace(/^ +/, "")[0];
  const safe =
    first !== undefined && FORMULA_PREFIXES.has(first) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Decimal major-unit string from integer minor units, without floating-point math. */
export function formatAmountPlain(
  amountMinor: number,
  currency: Payment["currency"],
): string {
  const exponent = currencyExponent(currency);
  if (exponent === 0) return String(amountMinor);
  const divisor = 10 ** exponent;
  const whole = Math.trunc(amountMinor / divisor);
  const fraction = String(amountMinor % divisor).padStart(exponent, "0");
  return `${whole}.${fraction}`;
}

function describeMethod(method: PaymentMethod): string {
  switch (method.type) {
    case "card":
      return `card ${method.brand} ${method.last4}`;
    case "wallet":
      return `wallet ${method.wallet} ${method.brand} ${method.last4}`;
    case "ach":
      return `ach ${method.bankName} ${method.last4}`;
  }
}

const HEADER = [
  "Payment ID",
  "Amount",
  "Currency",
  "Status",
  "Payment method",
  "Description",
  "Customer",
  "Date (UTC)",
  "Refunded date (UTC)",
  "Decline reason",
];

export function paymentsToCsv(payments: readonly Payment[]): string {
  const lines = [HEADER.map(escapeCsvField).join(",")];
  for (const payment of payments) {
    lines.push(
      [
        payment.id,
        formatAmountPlain(payment.amountMinor, payment.currency),
        payment.currency,
        STATUS_LABELS[payment.status],
        describeMethod(payment.method),
        payment.description,
        payment.customerEmail,
        payment.createdAt,
        payment.refundedAt ?? "",
        payment.declineReason ?? "",
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}
