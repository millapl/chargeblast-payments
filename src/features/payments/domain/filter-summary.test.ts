import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  summarizeAmount,
  summarizeCurrency,
  summarizeDate,
  summarizeMethod,
  summarizeStatus,
} from "./filter-summary";
import { DEFAULT_QUERY, type PaymentsQuery } from "./query";

const q = (overrides: Partial<PaymentsQuery>): PaymentsQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
});

describe("hasActiveFilters", () => {
  it("is false for the default query and for sort/page-size changes", () => {
    expect(hasActiveFilters(DEFAULT_QUERY)).toBe(false);
    expect(
      hasActiveFilters(
        q({ size: 100, page: 3, sort: [{ key: "amount", dir: "asc" }] }),
      ),
    ).toBe(false);
  });

  it.each([
    q({ status: ["failed"] }),
    q({ method: ["card"] }),
    q({ currency: ["USD"] }),
    q({ range: "7d" }),
    q({ min: "1" }),
    q({ max: "9" }),
    q({ q: "ada" }),
  ])("is true when any filter is set", (query) => {
    expect(hasActiveFilters(query)).toBe(true);
  });
});

describe("chip summaries", () => {
  it("summarises lists with a +N suffix", () => {
    expect(summarizeStatus(q({ status: ["succeeded"] }))).toBe("Succeeded");
    expect(
      summarizeStatus(q({ status: ["succeeded", "failed", "pending"] })),
    ).toBe("Succeeded +2");
    expect(summarizeMethod(q({ method: ["ach", "card"] }))).toBe("ACH +1");
    expect(summarizeCurrency(q({ currency: ["USD", "BRL"] }))).toBe("USD +1");
    expect(summarizeStatus(DEFAULT_QUERY)).toBe("");
  });

  it("summarises amount bounds", () => {
    expect(summarizeAmount({ min: "10", max: "99.50" })).toBe("10 – 99.50");
    expect(summarizeAmount({ min: "10", max: null })).toBe("≥ 10");
    expect(summarizeAmount({ min: null, max: "5" })).toBe("≤ 5");
    expect(summarizeAmount({ min: null, max: null })).toBe("");
  });

  it("summarises date presets and custom ranges", () => {
    expect(summarizeDate({ range: "all", from: null, to: null })).toBe("");
    expect(summarizeDate({ range: "today", from: null, to: null })).toBe(
      "Today",
    );
    expect(summarizeDate({ range: "7d", from: null, to: null })).toBe("7 days");
    expect(
      summarizeDate({ range: "custom", from: "2026-11-01", to: "2026-11-20" }),
    ).toBe("Nov 1 – Nov 20");
    expect(
      summarizeDate({ range: "custom", from: "2026-11-01", to: null }),
    ).toBe("From Nov 1");
    expect(
      summarizeDate({ range: "custom", from: null, to: "2026-11-20" }),
    ).toBe("Until Nov 20");
    expect(summarizeDate({ range: "custom", from: null, to: null })).toBe(
      "Custom",
    );
  });
});
