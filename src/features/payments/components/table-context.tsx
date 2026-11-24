"use client";

import { createContext, useContext } from "react";

interface PaymentsTableContextValue {
  /** Server render time in UTC ms; keeps relative times consistent between SSR and hydration. */
  now: number;
  announce: (message: string) => void;
}

export const PaymentsTableContext =
  createContext<PaymentsTableContextValue | null>(null);

export function usePaymentsTableContext(): PaymentsTableContextValue {
  const value = useContext(PaymentsTableContext);
  if (!value)
    throw new Error(
      "usePaymentsTableContext must be used inside <PaymentsTable>",
    );
  return value;
}
