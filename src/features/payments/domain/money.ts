import type { Currency } from "./types";

const LOCALE = "en-US";

/** ISO 4217 minor-unit exponents for the supported currencies. */
const CURRENCY_EXPONENT: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  BRL: 2,
  JPY: 0,
};

export function currencyExponent(currency: Currency): number {
  return CURRENCY_EXPONENT[currency];
}

/**
 * Formats an integer minor-unit amount, e.g. `{ 988, "USD" }` -> `$9.88`.
 * A space is inserted after alphabetic symbols (`R$ 99.99`) to match the reference.
 */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const exponent = currencyExponent(currency);
  const formatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  });
  // Division by a power of ten is exact enough for display: amounts are < 2^53 / 100
  // and Intl rounds to `exponent` digits. Comparison and filtering never use this value.
  const major = amountMinor / 10 ** exponent;
  return formatter
    .formatToParts(major)
    .map((part, index, parts) => {
      const next = parts[index + 1];
      if (
        part.type === "currency" &&
        /[A-Za-z]/.test(part.value) &&
        next?.type === "integer"
      ) {
        return `${part.value} `;
      }
      return part.value;
    })
    .join("");
}

/**
 * Normalises an amount to hundredths of a major unit using integer arithmetic only,
 * so amounts in currencies with different exponents compare on nominal value (ADR-007).
 * USD 9.88 -> 988, JPY 500 -> 50000.
 */
export function toHundredths(amountMinor: number, currency: Currency): number {
  return amountMinor * 10 ** (2 - currencyExponent(currency));
}

const AMOUNT_INPUT = /^(\d{1,9})(?:\.(\d{1,2}))?$/;

/**
 * Parses a user-entered decimal amount ("12", "12.5", "12.50") into hundredths of a
 * major unit. Returns `null` for anything else (signs, exponents, extra decimals, letters).
 */
export function parseAmountInput(input: string): number | null {
  const match = AMOUNT_INPUT.exec(input.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  return whole * 100 + fraction;
}

export function shortenPaymentId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 7)}…${id.slice(-4)}`;
}
