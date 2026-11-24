import { DISPLAY_TIME_ZONE, formatLocalTimestamp } from "./dates";
import { STATUS_LABELS } from "./labels";
import { currencyExponent } from "./money";
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

export const EXPORT_COLUMN_IDS = [
  "id",
  "amount",
  "currency",
  "status",
  "method",
  "description",
  "customer",
  "created",
  "refunded",
  "decline",
] as const;
export type ExportColumnId = (typeof EXPORT_COLUMN_IDS)[number];

export type ExportTimeZone = "utc" | "zone";

export interface CsvOptions {
  /** Columns to write, in canonical order. Defaults to every column. */
  columns?: readonly ExportColumnId[];
  /** `utc` writes ISO timestamps; `zone` writes local time in the display zone. */
  timeZone?: ExportTimeZone;
}

function exportTimeZoneLabel(timeZone: ExportTimeZone): string {
  return timeZone === "utc" ? "UTC" : DISPLAY_TIME_ZONE;
}

interface ColumnSpec {
  header: (timeZone: ExportTimeZone) => string;
  value: (payment: Payment, timeZone: ExportTimeZone) => string;
}

const date = (iso: string | null, timeZone: ExportTimeZone) => {
  if (iso === null) return "";
  return timeZone === "utc" ? iso : formatLocalTimestamp(iso);
};

const COLUMNS: Record<ExportColumnId, ColumnSpec> = {
  id: { header: () => "Payment ID", value: (p) => p.id },
  amount: {
    header: () => "Amount",
    value: (p) => formatAmountPlain(p.amountMinor, p.currency),
  },
  currency: { header: () => "Currency", value: (p) => p.currency },
  status: { header: () => "Status", value: (p) => STATUS_LABELS[p.status] },
  method: {
    header: () => "Payment method",
    value: (p) => describeMethod(p.method),
  },
  description: { header: () => "Description", value: (p) => p.description },
  customer: { header: () => "Customer", value: (p) => p.customerEmail },
  created: {
    header: (tz) => `Date (${exportTimeZoneLabel(tz)})`,
    value: (p, tz) => date(p.createdAt, tz),
  },
  refunded: {
    header: (tz) => `Refunded date (${exportTimeZoneLabel(tz)})`,
    value: (p, tz) => date(p.refundedAt, tz),
  },
  decline: {
    header: () => "Decline reason",
    value: (p) => p.declineReason ?? "",
  },
};

export function exportColumnHeader(
  id: ExportColumnId,
  timeZone: ExportTimeZone,
): string {
  return COLUMNS[id].header(timeZone);
}

export function paymentsToCsv(
  payments: readonly Payment[],
  { columns = EXPORT_COLUMN_IDS, timeZone = "utc" }: CsvOptions = {},
): string {
  const ids = EXPORT_COLUMN_IDS.filter((id) => columns.includes(id));
  const lines = [
    ids.map((id) => escapeCsvField(COLUMNS[id].header(timeZone))).join(","),
  ];
  for (const payment of payments) {
    lines.push(
      ids
        .map((id) => escapeCsvField(COLUMNS[id].value(payment, timeZone)))
        .join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}
