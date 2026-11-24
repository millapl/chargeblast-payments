import { Faker, en } from "@faker-js/faker";
import {
  WALLETS,
  type CardBrand,
  type Currency,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from "../domain/types";

export const DEFAULT_SEED = 20261124;
export const DEFAULT_COUNT = 500;

const HISTORY_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_DOMAINS = ["example.com", "example.org", "example.net"] as const;
const BANKS = [
  "Northwind Bank",
  "Contoso Credit Union",
  "Fabrikam Savings",
] as const;
const DESCRIPTIONS = [
  { value: "Subscription update", weight: 70 },
  { value: "Subscription creation", weight: 15 },
  { value: "Payment for Invoice", weight: 10 },
  { value: "One-time purchase", weight: 5 },
] as const;

const STATUS_WEIGHTS: readonly { value: PaymentStatus; weight: number }[] = [
  { value: "succeeded", weight: 69 },
  { value: "failed", weight: 12 },
  { value: "pending", weight: 6 },
  { value: "refunded", weight: 5 },
  { value: "canceled", weight: 3 },
  { value: "blocked", weight: 2 },
  { value: "disputed", weight: 1.5 },
  { value: "uncaptured", weight: 1.5 },
];

const CURRENCY_WEIGHTS: readonly { value: Currency; weight: number }[] = [
  { value: "USD", weight: 60 },
  { value: "BRL", weight: 12 },
  { value: "EUR", weight: 12 },
  { value: "GBP", weight: 10 },
  { value: "JPY", weight: 6 },
];

const BRAND_WEIGHTS: readonly { value: CardBrand; weight: number }[] = [
  { value: "visa", weight: 70 },
  { value: "mastercard", weight: 20 },
  { value: "amex", weight: 6 },
  { value: "discover", weight: 4 },
];

/** Common price points (minor units), mimicking subscription pricing. */
const PRICE_POINTS: Record<Currency, readonly number[]> = {
  USD: [499, 899, 999, 1099, 1198, 1318, 1538, 1598, 1998, 1999, 2198, 2999],
  EUR: [499, 899, 999, 1299, 1499, 1999, 2499],
  GBP: [399, 799, 1199, 1599, 1999, 3499],
  BRL: [1990, 4990, 9999, 14990, 18999, 29990],
  JPY: [500, 980, 1480, 1980, 2980, 4980],
};

/** Inclusive random ranges (minor units) for amounts that are not price points. */
const AMOUNT_RANGE: Record<Currency, readonly [number, number]> = {
  USD: [199, 49_999],
  EUR: [199, 45_000],
  GBP: [199, 40_000],
  BRL: [990, 199_999],
  JPY: [300, 80_000],
};

const DECLINE_REASONS: Record<"failed" | "blocked", readonly string[]> = {
  failed: [
    "Insufficient funds",
    "Do not honor",
    "Transaction not allowed",
    "Card declined",
    "Expired card",
  ],
  blocked: ["Blocked for suspected fraud", "Highest risk level"],
};

export interface GenerateOptions {
  seed?: number;
  count?: number;
  /** Rows are created in the window `[anchor - 45 days, anchor]`. Never in the future. */
  anchor: Date;
}

export function generatePayments({
  seed = DEFAULT_SEED,
  count = DEFAULT_COUNT,
  anchor,
}: GenerateOptions): Payment[] {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  const anchorMs = anchor.getTime();

  const pickWeighted = <T>(
    items: readonly { value: T; weight: number }[],
  ): T => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = faker.number.float({ min: 0, max: total, fractionDigits: 6 });
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item.value;
    }
    return items[items.length - 1].value;
  };

  const slug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase();

  const makeMethod = (): PaymentMethod => {
    const last4 = faker.string.numeric(4);
    const kind = faker.number.int({ min: 1, max: 100 });
    const brand = pickWeighted(BRAND_WEIGHTS);
    if (kind <= 75) return { type: "card", brand, last4 };
    if (kind <= 90) {
      return {
        type: "wallet",
        wallet: faker.helpers.arrayElement(WALLETS),
        brand,
        last4,
      };
    }
    return { type: "ach", bankName: faker.helpers.arrayElement(BANKS), last4 };
  };

  const rows: Payment[] = [];
  const usedIds = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    let id: string;
    do {
      id = `pi_${faker.string.alphanumeric(24)}`;
    } while (usedIds.has(id));
    usedIds.add(id);

    const currency = pickWeighted(CURRENCY_WEIGHTS);
    const [low, high] = AMOUNT_RANGE[currency];
    const amountMinor =
      faker.number.int({ min: 1, max: 100 }) <= 60
        ? faker.helpers.arrayElement(PRICE_POINTS[currency])
        : faker.number.int({ min: low, max: high });

    // Skew towards recent days so short presets (Today / 7 days) always have rows.
    const age = Math.floor(
      HISTORY_DAYS * DAY_MS * faker.number.float({ min: 0, max: 1 }) ** 1.8,
    );
    const createdMs = anchorMs - age;

    const status = pickWeighted(STATUS_WEIGHTS);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const handle = `${slug(firstName)}.${slug(lastName)}${faker.number.int({ min: 1, max: 99 })}`;

    const refundedMs =
      status === "refunded"
        ? Math.min(
            createdMs +
              faker.number.int({ min: 60 * 60 * 1000, max: 5 * DAY_MS }),
            anchorMs,
          )
        : null;

    rows.push({
      id,
      amountMinor,
      currency,
      status,
      customerName: `${firstName} ${lastName}`,
      customerEmail: `${handle}@${faker.helpers.arrayElement(EMAIL_DOMAINS)}`,
      description: pickWeighted(DESCRIPTIONS),
      method: makeMethod(),
      createdAt: new Date(createdMs).toISOString(),
      refundedAt:
        refundedMs === null ? null : new Date(refundedMs).toISOString(),
      declineReason:
        status === "failed" || status === "blocked"
          ? faker.helpers.arrayElement(DECLINE_REASONS[status])
          : null,
    });
  }

  return rows.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
