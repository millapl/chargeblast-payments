import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { DEFAULT_QUERY, type PaymentsQuery } from "./query";
import {
  CURRENCIES,
  DATE_RANGES,
  DEFAULT_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
  MAX_SORT_KEYS,
  METHOD_TYPES,
  PAGE_SIZES,
  PAYMENT_STATUSES,
  SORT_KEYS,
  type SortSpec,
} from "./types";

const SORT_BY_TOKEN: ReadonlyMap<string, SortSpec> = new Map(
  SORT_KEYS.flatMap((key) =>
    (["asc", "desc"] as const).map((dir): [string, SortSpec] => [
      `${key}:${dir}`,
      { key, dir },
    ]),
  ),
);
const MAX_PAGE = 100_000;
const AMOUNT_PARAM = /^\d{1,9}(\.\d{1,2})?$/;
const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The single URL schema, shared by the server loader and client hooks (ADR-002).
 * Every parser returns `null` (-> default) for invalid input; nothing here throws.
 */
export const paymentsSearchParams = {
  status: parseAsArrayOf(parseAsStringLiteral(PAYMENT_STATUSES)).withDefault(
    [],
  ),
  method: parseAsArrayOf(parseAsStringLiteral(METHOD_TYPES)).withDefault([]),
  currency: parseAsArrayOf(parseAsStringLiteral(CURRENCIES)).withDefault([]),
  range: parseAsStringLiteral(DATE_RANGES).withDefault("all"),
  from: parseAsString,
  to: parseAsString,
  min: parseAsString,
  max: parseAsString,
  q: parseAsString.withDefault(""),
  sort: parseAsArrayOf(
    parseAsStringLiteral([...SORT_BY_TOKEN.keys()]),
  ).withDefault([]),
  page: parseAsInteger.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZES).withDefault(DEFAULT_PAGE_SIZE),
};

export type PaymentsSearchParamValues = inferParserType<
  typeof paymentsSearchParams
>;

const loadPaymentsSearchParams = createLoader(paymentsSearchParams);
export const serializePaymentsSearchParams =
  createSerializer(paymentsSearchParams);

function parseSort(tokens: readonly string[]): SortSpec[] {
  const seen = new Set<string>();
  const specs: SortSpec[] = [];
  for (const token of tokens) {
    const spec = SORT_BY_TOKEN.get(token);
    if (!spec || seen.has(spec.key)) continue;
    seen.add(spec.key);
    specs.push(spec);
    if (specs.length === MAX_SORT_KEYS) break;
  }
  return specs;
}

function pattern(value: string | null, regex: RegExp): string | null {
  return value !== null && regex.test(value) ? value : null;
}

/** Applies the limits and cross-field rules that parsers alone cannot express. */
export function toPaymentsQuery(
  values: PaymentsSearchParamValues,
): PaymentsQuery {
  const sort = parseSort(values.sort);
  const custom = values.range === "custom";
  return {
    status: [...new Set(values.status)],
    method: [...new Set(values.method)],
    currency: [...new Set(values.currency)],
    range: values.range,
    from: custom ? pattern(values.from, DATE_PARAM) : null,
    to: custom ? pattern(values.to, DATE_PARAM) : null,
    min: pattern(values.min, AMOUNT_PARAM),
    max: pattern(values.max, AMOUNT_PARAM),
    q: values.q.trim().slice(0, MAX_SEARCH_LENGTH),
    sort: sort.length > 0 ? sort : DEFAULT_QUERY.sort,
    page: Math.min(Math.max(1, values.page), MAX_PAGE),
    size: values.size,
  };
}

type SearchParamsInput =
  URLSearchParams | Record<string, string | string[] | undefined>;

/** Parses untrusted URL input into a safe query. Never throws. */
export function parsePaymentsQuery(input: SearchParamsInput): PaymentsQuery {
  return toPaymentsQuery(loadPaymentsSearchParams(input));
}
