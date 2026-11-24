import { describe, expect, it } from "vitest";
import {
  formatMoney,
  parseAmountInput,
  shortenPaymentId,
  toHundredths,
} from "./money";

describe("formatMoney", () => {
  it.each([
    [988, "USD", "$9.88"],
    [1599, "GBP", "£15.99"],
    [9999, "BRL", "R$ 99.99"],
    [1999, "EUR", "€19.99"],
    [500, "JPY", "¥500"],
    [100_000_00, "USD", "$100,000.00"],
  ] as const)("formats %i %s as %s", (minor, currency, expected) => {
    expect(formatMoney(minor, currency)).toBe(expected);
  });
});

describe("toHundredths", () => {
  it("normalises currencies with different exponents using integers only", () => {
    expect(toHundredths(988, "USD")).toBe(988);
    expect(toHundredths(500, "JPY")).toBe(50_000);
  });
});

describe("parseAmountInput", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.07", 7],
    [" 3 ", 300],
  ])("accepts %j", (input, expected) => {
    expect(parseAmountInput(input)).toBe(expected);
  });

  it.each([
    "",
    "-1",
    "+1",
    "1e3",
    "1.234",
    "abc",
    "1,5",
    "NaN",
    "Infinity",
    "1234567890",
    ".5",
    "1.",
  ])("rejects %j", (input) => {
    expect(parseAmountInput(input)).toBeNull();
  });
});

describe("shortenPaymentId", () => {
  it("keeps the prefix and the last four characters", () => {
    expect(shortenPaymentId("pi_3QabcdefghijklmnopqrX9Kd")).toBe(
      "pi_3Qab…X9Kd",
    );
  });

  it("does not alter short ids", () => {
    expect(shortenPaymentId("pi_123")).toBe("pi_123");
  });
});
