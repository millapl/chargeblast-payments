import { describe, expect, it } from "vitest";
import { buildTimeline } from "./timeline";
import { PAYMENT_ID_PATTERN, type Payment } from "./types";

const base: Payment = {
  id: "pi_000000000000000000000001",
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
};

const titles = (payment: Payment) =>
  buildTimeline(payment).map((event) => event.title);

describe("buildTimeline", () => {
  it("always starts with creation at the payment time", () => {
    const [first] = buildTimeline(base);
    expect(first).toMatchObject({
      title: "Payment created",
      at: base.createdAt,
    });
  });

  it("covers every status", () => {
    expect(titles(base)).toEqual(["Payment created", "Payment succeeded"]);
    expect(titles({ ...base, status: "pending" })).toEqual([
      "Payment created",
      "Payment is pending",
    ]);
    expect(titles({ ...base, status: "canceled" })).toEqual([
      "Payment created",
      "Payment was canceled",
    ]);
    expect(titles({ ...base, status: "uncaptured" })).toEqual([
      "Payment created",
      "Payment authorized, awaiting capture",
    ]);
    expect(titles({ ...base, status: "disputed" })).toEqual([
      "Payment created",
      "Payment succeeded",
      "Dispute opened",
    ]);
  });

  it("includes the decline reason for failed and blocked payments", () => {
    const failed = buildTimeline({
      ...base,
      status: "failed",
      declineReason: "Do not honor",
    });
    expect(failed.at(-1)).toMatchObject({
      title: "Payment failed",
      description: "Do not honor",
    });
    const blocked = buildTimeline({
      ...base,
      status: "blocked",
      declineReason: "Highest risk level",
    });
    expect(blocked.at(-1)).toMatchObject({
      title: "Payment blocked",
      description: "Highest risk level",
    });
  });

  it("places the refund at the stored refund time", () => {
    const refunded = buildTimeline({
      ...base,
      status: "refunded",
      refundedAt: "2026-11-25T08:00:00.000Z",
    });
    expect(refunded.map((event) => event.title)).toEqual([
      "Payment created",
      "Payment succeeded",
      "Payment refunded",
    ]);
    expect(refunded.at(-1)?.at).toBe("2026-11-25T08:00:00.000Z");
  });

  it("returns events in chronological order", () => {
    const events = buildTimeline({
      ...base,
      status: "refunded",
      refundedAt: "2026-11-24T12:00:30.000Z",
    });
    const times = events.map((event) => Date.parse(event.at));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

describe("PAYMENT_ID_PATTERN", () => {
  it("stays identical to the copy inside src/proxy.ts", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const proxySource = readFileSync(
      join(process.cwd(), "src", "proxy.ts"),
      "utf8",
    );
    expect(proxySource).toContain(
      `const PAYMENT_ID = ${PAYMENT_ID_PATTERN.toString()};`,
    );
  });

  it("accepts generated ids and rejects anything else", () => {
    expect(PAYMENT_ID_PATTERN.test("pi_AbCdEfGhIjKlMnOpQrStUvWx")).toBe(true);
    for (const bad of [
      "",
      "pi_short",
      "px_AbCdEfGhIjKlMnOpQrStUvWx",
      "pi_AbCdEfGhIjKlMnOpQrStUvW/",
      "../etc/passwd",
      "pi_AbCdEfGhIjKlMnOpQrStUvWxY",
    ]) {
      expect(PAYMENT_ID_PATTERN.test(bad)).toBe(false);
    }
  });
});
