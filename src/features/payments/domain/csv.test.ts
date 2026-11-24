import { describe, expect, it } from "vitest";
import { escapeCsvField, formatAmountPlain, paymentsToCsv } from "./csv";
import type { Payment } from "./types";

describe("escapeCsvField", () => {
  it.each([
    ['=HYPERLINK("http://evil","x")', '"\'=HYPERLINK(""http://evil"",""x"")"'],
    ["=1+1", "'=1+1"],
    ["+1", "'+1"],
    ["-1+1", "'-1+1"],
    ["@SUM(A1)", "'@SUM(A1)"],
    ["\tcmd", "'\tcmd"],
    [" =1+1", "' =1+1"],
    ["  @SUM(A1)", "'  @SUM(A1)"],
    ["plain", "plain"],
    ["", ""],
  ])("neutralises formulas: %j", (input, expected) => {
    expect(escapeCsvField(input)).toBe(expected);
  });

  it("neutralises a leading carriage return and quotes it", () => {
    expect(escapeCsvField("\rcmd")).toBe('"\'\rcmd"');
  });

  it("quotes commas, quotes and newlines and doubles embedded quotes", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("does not touch dashes or at-signs that are not leading", () => {
    expect(escapeCsvField("a-b@c.com")).toBe("a-b@c.com");
  });
});

describe("formatAmountPlain", () => {
  it("formats with integer arithmetic", () => {
    expect(formatAmountPlain(988, "USD")).toBe("9.88");
    expect(formatAmountPlain(5, "USD")).toBe("0.05");
    expect(formatAmountPlain(100_000_00, "BRL")).toBe("100000.00");
    expect(formatAmountPlain(500, "JPY")).toBe("500");
  });
});

describe("paymentsToCsv", () => {
  const base: Payment = {
    id: "pi_000000000000000000000001",
    amountMinor: 1998,
    currency: "USD",
    status: "failed",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    description: "Subscription update",
    method: { type: "card", brand: "visa", last4: "4242" },
    createdAt: "2026-11-24T12:00:00.000Z",
    refundedAt: null,
    declineReason: "Insufficient funds",
  };

  it("writes a header and one CRLF-terminated line per payment", () => {
    const csv = paymentsToCsv([base]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "Payment ID,Amount,Currency,Status,Payment method,Description,Customer,Date (UTC),Refunded date (UTC),Decline reason",
    );
    expect(lines[1]).toBe(
      "pi_000000000000000000000001,19.98,USD,Failed,card visa 4242,Subscription update,ada@example.com,2026-11-24T12:00:00.000Z,,Insufficient funds",
    );
    expect(lines[2]).toBe("");
  });

  it("neutralises formulas in user-controlled text columns", () => {
    const csv = paymentsToCsv([
      {
        ...base,
        description: "=cmd|' /C calc'!A0",
        customerEmail: "+evil@example.com",
        declineReason: "@x",
      },
    ]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain("'=cmd|' /C calc'!A0");
    expect(row).toContain("'+evil@example.com");
    expect(row).toContain("'@x");
  });

  it("returns only the header for an empty list", () => {
    expect(paymentsToCsv([]).split("\r\n")).toHaveLength(2);
  });
});
