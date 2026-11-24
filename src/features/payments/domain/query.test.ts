import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUERY,
  filterPayments,
  matchesSearch,
  queryPayments,
  sortPayments,
  type PaymentsQuery,
} from "./query";
import type { Currency, Payment, PaymentStatus } from "./types";

const NOW = Date.parse("2026-11-24T15:30:00Z");
let counter = 0;

function make(overrides: Partial<Payment> = {}): Payment {
  counter += 1;
  return {
    id: `pi_${String(counter).padStart(24, "0")}`,
    amountMinor: 1000,
    currency: "USD",
    status: "succeeded",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    description: "Subscription update",
    method: { type: "card", brand: "visa", last4: "4242" },
    createdAt: "2026-11-24T12:00:00.000Z",
    refundedAt: null,
    declineReason: null,
    ...overrides,
  };
}

const q = (overrides: Partial<PaymentsQuery>): PaymentsQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
});

describe("matchesSearch", () => {
  const payment = make({
    id: "pi_AbCdEf000000000000000001",
    customerEmail: "Grace.Hopper@example.com",
    method: { type: "card", brand: "visa", last4: "0451" },
  });

  it("matches id substrings case-insensitively", () => {
    expect(matchesSearch(payment, "abcdef")).toBe(true);
  });

  it("matches email substrings case-insensitively", () => {
    expect(matchesSearch(payment, "hopper@")).toBe(true);
  });

  it("matches last4 only for exactly four digits", () => {
    expect(matchesSearch(payment, "0451")).toBe(true);
    expect(matchesSearch(payment, "045")).toBe(false);
    expect(matchesSearch(payment, "04511")).toBe(false);
  });

  it("trims input and treats empty queries as no filter", () => {
    expect(matchesSearch(payment, "   ")).toBe(true);
    expect(matchesSearch(payment, "  hopper  ")).toBe(true);
  });

  it("treats regex metacharacters literally", () => {
    expect(matchesSearch(payment, ".*")).toBe(false);
    expect(matchesSearch(payment, "(")).toBe(false);
    expect(matchesSearch(payment, "[a-z]+@")).toBe(false);
  });
});

describe("filterPayments", () => {
  const rows = [
    make({ status: "succeeded", currency: "USD", amountMinor: 1000 }),
    make({
      status: "failed",
      declineReason: "x",
      currency: "EUR",
      amountMinor: 2500,
    }),
    make({
      status: "refunded",
      refundedAt: "2026-11-24T13:00:00.000Z",
      currency: "JPY",
      amountMinor: 3000,
      method: {
        type: "wallet",
        wallet: "apple_pay",
        brand: "visa",
        last4: "1111",
      },
    }),
    make({
      status: "pending",
      method: { type: "ach", bankName: "B", last4: "9999" },
    }),
  ];

  it("returns everything with the default query", () => {
    expect(filterPayments(rows, DEFAULT_QUERY, NOW)).toHaveLength(4);
  });

  it("filters by multiple statuses", () => {
    const result = filterPayments(
      rows,
      q({ status: ["failed", "pending"] as PaymentStatus[] }),
      NOW,
    );
    expect(result.map((row) => row.status).sort()).toEqual([
      "failed",
      "pending",
    ]);
  });

  it("filters by method type", () => {
    expect(
      filterPayments(rows, q({ method: ["wallet", "ach"] }), NOW),
    ).toHaveLength(2);
  });

  it("filters by currency", () => {
    expect(
      filterPayments(rows, q({ currency: ["EUR" as Currency] }), NOW),
    ).toHaveLength(1);
  });

  it("applies nominal amount bounds inclusively across currencies", () => {
    // USD 10.00, EUR 25.00, JPY 3000 (nominal 3000.00), USD 10.00
    expect(filterPayments(rows, q({ min: "10", max: "25" }), NOW)).toHaveLength(
      3,
    );
    expect(filterPayments(rows, q({ min: "25.01" }), NOW)).toHaveLength(1);
    expect(filterPayments(rows, q({ max: "9.99" }), NOW)).toHaveLength(0);
  });

  it("treats min > max as unbounded instead of empty", () => {
    expect(filterPayments(rows, q({ min: "100", max: "1" }), NOW)).toHaveLength(
      4,
    );
  });

  it("ignores unparsable amount bounds", () => {
    expect(filterPayments(rows, q({ min: "abc" }), NOW)).toHaveLength(4);
  });

  it("applies the date window at day boundaries in the display zone", () => {
    const edge = [
      make({ createdAt: "2026-11-24T02:59:59.999Z" }), // 23:59 on the 23rd in São Paulo
      make({ createdAt: "2026-11-24T03:00:00.000Z" }), // 00:00 on the 24th
    ];
    const today = filterPayments(edge, q({ range: "today" }), NOW);
    expect(today.map((row) => row.createdAt)).toEqual([
      "2026-11-24T03:00:00.000Z",
    ]);
  });

  it("excludes rows after `now` for trailing presets", () => {
    const future = make({ createdAt: "2026-11-25T00:00:00.000Z" });
    expect(filterPayments([future], q({ range: "7d" }), NOW)).toHaveLength(0);
  });

  it("combines filters with AND", () => {
    const result = filterPayments(
      rows,
      q({
        status: ["succeeded", "failed"] as PaymentStatus[],
        currency: ["EUR" as Currency],
      }),
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("failed");
  });
});

describe("sortPayments", () => {
  const a = make({
    id: "pi_000000000000000000000a",
    amountMinor: 500,
    createdAt: "2026-11-20T00:00:00.000Z",
    status: "failed",
    declineReason: "x",
  });
  const b = make({
    id: "pi_000000000000000000000b",
    amountMinor: 500,
    createdAt: "2026-11-22T00:00:00.000Z",
    status: "succeeded",
  });
  const c = make({
    id: "pi_000000000000000000000c",
    amountMinor: 900,
    createdAt: "2026-11-21T00:00:00.000Z",
    status: "blocked",
    declineReason: "x",
  });
  const jpy = make({
    id: "pi_000000000000000000000d",
    amountMinor: 700,
    currency: "JPY",
    createdAt: "2026-11-19T00:00:00.000Z",
    status: "pending",
  });
  const ids = (rows: Payment[]) => rows.map((row) => row.id.slice(-1));

  it("sorts by date in both directions", () => {
    expect(
      ids(sortPayments([a, b, c, jpy], [{ key: "date", dir: "desc" }])),
    ).toEqual(["b", "c", "a", "d"]);
    expect(
      ids(sortPayments([a, b, c, jpy], [{ key: "date", dir: "asc" }])),
    ).toEqual(["d", "a", "c", "b"]);
  });

  it("sorts amount by nominal value across currencies, breaking ties by id", () => {
    // nominal: a 5.00, b 5.00, c 9.00, jpy 700.00
    expect(
      ids(sortPayments([jpy, c, b, a], [{ key: "amount", dir: "asc" }])),
    ).toEqual(["a", "b", "c", "d"]);
    expect(
      ids(sortPayments([jpy, c, b, a], [{ key: "amount", dir: "desc" }])),
    ).toEqual(["d", "c", "a", "b"]);
  });

  it("sorts status alphabetically by label", () => {
    expect(
      ids(sortPayments([a, b, c, jpy], [{ key: "status", dir: "asc" }])),
    ).toEqual(["c", "a", "d", "b"]);
  });

  it("supports multi-column sorting in priority order", () => {
    const result = sortPayments(
      [a, b, c, jpy],
      [
        { key: "amount", dir: "asc" },
        { key: "date", dir: "desc" },
      ],
    );
    expect(ids(result)).toEqual(["b", "a", "c", "d"]);
  });

  it("does not mutate its input", () => {
    const input = [a, b];
    sortPayments(input, [{ key: "date", dir: "asc" }]);
    expect(input).toEqual([a, b]);
  });
});

describe("queryPayments", () => {
  const rows = Array.from({ length: 60 }, (_, index) =>
    make({ createdAt: new Date(NOW - index * 60_000).toISOString() }),
  );

  it("paginates with the requested size and reports indices", () => {
    const first = queryPayments(rows, q({ size: 25 }), NOW);
    expect(first).toMatchObject({
      total: 60,
      page: 1,
      pageCount: 3,
      firstIndex: 1,
      lastIndex: 25,
    });
    expect(first.items).toHaveLength(25);
    const last = queryPayments(rows, q({ size: 25, page: 3 }), NOW);
    expect(last).toMatchObject({ page: 3, firstIndex: 51, lastIndex: 60 });
    expect(last.items).toHaveLength(10);
  });

  it("clamps out-of-range pages", () => {
    expect(queryPayments(rows, q({ size: 50, page: 99 }), NOW).page).toBe(2);
    expect(queryPayments(rows, q({ page: -4 }), NOW).page).toBe(1);
  });

  it("reports an empty result cleanly", () => {
    const result = queryPayments(rows, q({ q: "no-such-customer" }), NOW);
    expect(result).toMatchObject({
      items: [],
      total: 0,
      page: 1,
      pageCount: 1,
      firstIndex: 0,
      lastIndex: 0,
    });
  });

  it("returns newest first by default", () => {
    const { items } = queryPayments(rows, DEFAULT_QUERY, NOW);
    expect(items[0]?.createdAt).toBe(new Date(NOW).toISOString());
  });
});
