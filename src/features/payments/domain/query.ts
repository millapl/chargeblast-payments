import { resolveTimeWindow } from "./dates";
import { parseAmountInput, toHundredths } from "./money";
import {
  DEFAULT_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
  PAYMENT_STATUSES,
  type Currency,
  type DateRange,
  type MethodType,
  type PageSize,
  type Payment,
  type PaymentStatus,
  type SortSpec,
} from "./types";

export interface PaymentsQuery {
  status: readonly PaymentStatus[];
  method: readonly MethodType[];
  currency: readonly Currency[];
  range: DateRange;
  /** `YYYY-MM-DD`, only used when `range === "custom"`. */
  from: string | null;
  to: string | null;
  /** Decimal major-unit strings, e.g. "12.50". */
  min: string | null;
  max: string | null;
  q: string;
  sort: readonly SortSpec[];
  page: number;
  size: PageSize;
}

export const DEFAULT_SORT: readonly SortSpec[] = [{ key: "date", dir: "desc" }];

export const DEFAULT_QUERY: PaymentsQuery = {
  status: [],
  method: [],
  currency: [],
  range: "all",
  from: null,
  to: null,
  min: null,
  max: null,
  q: "",
  sort: DEFAULT_SORT,
  page: 1,
  size: DEFAULT_PAGE_SIZE,
};

export interface PaymentsPage {
  items: Payment[];
  /** Number of rows matching the filters, before pagination. */
  total: number;
  /** Current page after clamping to the valid range (1-based). */
  page: number;
  pageCount: number;
  /** 1-based inclusive index of the first / last row shown; 0 when empty. */
  firstIndex: number;
  lastIndex: number;
}

/** Sort order for status is alphabetical by display label. */
const STATUS_RANK: Record<PaymentStatus, number> = Object.fromEntries(
  [...PAYMENT_STATUSES].sort().map((status, index) => [status, index]),
) as Record<PaymentStatus, number>;

export function matchesSearch(payment: Payment, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase().slice(0, MAX_SEARCH_LENGTH);
  if (query === "") return true;
  if (payment.id.toLowerCase().includes(query)) return true;
  if (payment.customerEmail.toLowerCase().includes(query)) return true;
  return /^\d{4}$/.test(query) && payment.method.last4 === query;
}

function compare(a: Payment, b: Payment, { key, dir }: SortSpec): number {
  let result: number;
  switch (key) {
    case "date":
      result = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      break;
    case "amount":
      result =
        toHundredths(a.amountMinor, a.currency) -
        toHundredths(b.amountMinor, b.currency);
      break;
    case "status":
      result = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      break;
  }
  return dir === "asc" ? result : -result;
}

export function filterPayments(
  payments: readonly Payment[],
  query: PaymentsQuery,
  now: number,
): Payment[] {
  const window = resolveTimeWindow(query.range, query.from, query.to, now);
  const min = query.min === null ? null : parseAmountInput(query.min);
  const max = query.max === null ? null : parseAmountInput(query.max);
  // A reversed range (min > max) is treated as unbounded rather than empty.
  const bounds =
    min !== null && max !== null && min > max
      ? { min: null, max: null }
      : { min, max };

  return payments.filter((payment) => {
    if (query.status.length > 0 && !query.status.includes(payment.status))
      return false;
    if (query.method.length > 0 && !query.method.includes(payment.method.type))
      return false;
    if (query.currency.length > 0 && !query.currency.includes(payment.currency))
      return false;

    const created = Date.parse(payment.createdAt);
    if (window.start !== null && created < window.start) return false;
    if (window.end !== null && created > window.end) return false;

    if (bounds.min !== null || bounds.max !== null) {
      const nominal = toHundredths(payment.amountMinor, payment.currency);
      if (bounds.min !== null && nominal < bounds.min) return false;
      if (bounds.max !== null && nominal > bounds.max) return false;
    }
    return matchesSearch(payment, query.q);
  });
}

export function sortPayments(
  payments: readonly Payment[],
  sort: readonly SortSpec[],
): Payment[] {
  const specs = sort.length > 0 ? sort : DEFAULT_SORT;
  return [...payments].sort((a, b) => {
    for (const spec of specs) {
      const result = compare(a, b, spec);
      if (result !== 0) return result;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Filter -> search -> sort -> paginate. Pure: `now` is injected. */
export function queryPayments(
  payments: readonly Payment[],
  query: PaymentsQuery,
  now: number,
): PaymentsPage {
  const sorted = sortPayments(filterPayments(payments, query, now), query.sort);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / query.size));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const offset = (page - 1) * query.size;
  const items = sorted.slice(offset, offset + query.size);
  return {
    items,
    total,
    page,
    pageCount,
    firstIndex: total === 0 ? 0 : offset + 1,
    lastIndex: offset + items.length,
  };
}
