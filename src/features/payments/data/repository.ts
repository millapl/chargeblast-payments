import { generatePayments } from "./generate";
import type { Payment } from "../domain/types";

const HOUR_MS = 60 * 60 * 1000;

let cache: { key: number; rows: readonly Payment[] } | null = null;

/**
 * Returns the in-memory dataset for the hour containing `now`.
 * Rows are seeded and deterministic for a given hour: ids and relative ages never change,
 * the whole window just slides forward hourly so date presets always find data (ADR-006).
 */
export function getPayments(now: Date): readonly Payment[] {
  const key = Math.floor(now.getTime() / HOUR_MS);
  if (cache?.key !== key) {
    cache = {
      key,
      rows: generatePayments({ anchor: new Date(key * HOUR_MS) }),
    };
  }
  return cache.rows;
}

export function getPaymentById(id: string, now: Date): Payment | undefined {
  return getPayments(now).find((payment) => payment.id === id);
}
