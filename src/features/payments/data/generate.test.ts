import { describe, expect, it } from "vitest";
import { paymentSchema } from "../domain/schemas";
import { CURRENCIES } from "../domain/types";
import { generatePayments } from "./generate";
import { getPayments } from "./repository";

const anchor = new Date("2026-11-24T15:00:00Z");
const rows = generatePayments({ anchor });

describe("generatePayments", () => {
  it("is deterministic for a given seed and anchor", () => {
    expect(generatePayments({ anchor })).toEqual(rows);
  });

  it("changes with the seed", () => {
    expect(generatePayments({ anchor, seed: 1 })).not.toEqual(rows);
  });

  it("produces 300-1000 rows (REQ-DATA-02)", () => {
    expect(rows.length).toBeGreaterThanOrEqual(300);
    expect(rows.length).toBeLessThanOrEqual(1000);
  });

  it("produces schema-valid rows with unique ids", () => {
    for (const row of rows) {
      const result = paymentSchema.safeParse(row);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    }
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it("covers every currency and the four official statuses (REQ-DATA-04/05)", () => {
    expect(new Set(rows.map((row) => row.currency))).toEqual(
      new Set(CURRENCIES),
    );
    const statuses = new Set(rows.map((row) => row.status));
    for (const status of [
      "succeeded",
      "pending",
      "failed",
      "refunded",
    ] as const) {
      expect(statuses.has(status)).toBe(true);
    }
  });

  it("never creates rows in the future and spans recent days", () => {
    const anchorMs = anchor.getTime();
    expect(rows.every((row) => Date.parse(row.createdAt) <= anchorMs)).toBe(
      true,
    );
    const lastDay = rows.filter(
      (row) => anchorMs - Date.parse(row.createdAt) < 86_400_000,
    );
    expect(lastDay.length).toBeGreaterThan(5);
  });

  it("uses only reserved example domains for emails", () => {
    expect(
      rows.every((row) => /@example\.(com|org|net)$/.test(row.customerEmail)),
    ).toBe(true);
  });

  it("returns rows newest first", () => {
    const times = rows.map((row) => Date.parse(row.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("paymentSchema", () => {
  const valid = rows.find((row) => row.status === "succeeded");
  if (!valid)
    throw new Error("fixture: expected at least one succeeded payment");

  it("rejects non-integer, zero and negative amounts", () => {
    for (const amountMinor of [1.5, 0, -100]) {
      expect(paymentSchema.safeParse({ ...valid, amountMinor }).success).toBe(
        false,
      );
    }
  });

  it("enforces the refundedAt and declineReason invariants", () => {
    expect(
      paymentSchema.safeParse({ ...valid, refundedAt: valid.createdAt })
        .success,
    ).toBe(false);
    expect(
      paymentSchema.safeParse({ ...valid, declineReason: "x" }).success,
    ).toBe(false);
    expect(
      paymentSchema.safeParse({ ...valid, status: "failed" }).success,
    ).toBe(false);
  });

  it("rejects malformed ids and last4", () => {
    expect(paymentSchema.safeParse({ ...valid, id: "pi_short" }).success).toBe(
      false,
    );
    expect(
      paymentSchema.safeParse({
        ...valid,
        method: { type: "card", brand: "visa", last4: "12" },
      }).success,
    ).toBe(false);
  });
});

describe("getPayments", () => {
  it("returns the same array within an hour and shifts the window in the next hour", () => {
    const a = getPayments(new Date("2026-11-24T15:05:00Z"));
    const b = getPayments(new Date("2026-11-24T15:55:00Z"));
    expect(b).toBe(a);
    const c = getPayments(new Date("2026-11-24T16:05:00Z"));
    expect(c).not.toBe(a);
    expect(c.map((row) => row.id)).toEqual(a.map((row) => row.id));
  });
});
