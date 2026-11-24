import { METHOD_LABELS, STATUS_LABELS } from "./labels";
import { parseDateInput } from "./dates";
import type { PaymentsQuery } from "./query";
import type { PaymentsSearchParamValues } from "./url-state";

/** URL values that reset every filter while keeping sort and page size. */
export const clearedFilters = (): Partial<PaymentsSearchParamValues> => ({
  status: [],
  method: [],
  currency: [],
  range: "all",
  from: null,
  to: null,
  min: null,
  max: null,
  q: "",
  page: 1,
});

export function hasActiveFilters(query: PaymentsQuery): boolean {
  return (
    query.status.length > 0 ||
    query.method.length > 0 ||
    query.currency.length > 0 ||
    query.range !== "all" ||
    query.min !== null ||
    query.max !== null ||
    query.q !== ""
  );
}

function summarizeList(labels: readonly string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels[0]} +${labels.length - 1}`;
}

export const summarizeStatus = (query: PaymentsQuery) =>
  summarizeList(query.status.map((status) => STATUS_LABELS[status]));

export const summarizeMethod = (query: PaymentsQuery) =>
  summarizeList(query.method.map((method) => METHOD_LABELS[method]));

export const summarizeCurrency = (query: PaymentsQuery) =>
  summarizeList(query.currency);

export function summarizeAmount({
  min,
  max,
}: Pick<PaymentsQuery, "min" | "max">): string {
  if (min !== null && max !== null) return `${min} – ${max}`;
  if (min !== null) return `≥ ${min}`;
  if (max !== null) return `≤ ${max}`;
  return "";
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function shortDate(input: string | null): string | null {
  const parsed = input === null ? null : parseDateInput(input);
  if (!parsed) return null;
  return SHORT_DATE.format(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

export const DATE_RANGE_LABELS = {
  all: "All time",
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  month: "Current month",
  "4w": "Last 4 weeks",
  "last-month": "Last month",
  custom: "Custom",
} as const;

export function summarizeDate({
  range,
  from,
  to,
}: Pick<PaymentsQuery, "range" | "from" | "to">): string {
  if (range === "all") return "";
  if (range !== "custom") return DATE_RANGE_LABELS[range];
  const start = shortDate(from);
  const end = shortDate(to);
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return DATE_RANGE_LABELS.custom;
}
