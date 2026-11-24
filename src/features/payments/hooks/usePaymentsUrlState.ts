"use client";

import { useQueryStates } from "nuqs";
import { paymentsSearchParams } from "../domain/url-state";

/** Client-side access to the URL query. Updates re-render the server component (`shallow: false`). */
export function usePaymentsUrlState() {
  return useQueryStates(paymentsSearchParams, {
    shallow: false,
    clearOnDefault: true,
  });
}
