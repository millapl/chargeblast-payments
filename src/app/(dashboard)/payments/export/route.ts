import type { NextRequest } from "next/server";
import { getPayments } from "@/features/payments/data/repository";
import { paymentsToCsv } from "@/features/payments/domain/csv";
import { filterPayments, sortPayments } from "@/features/payments/domain/query";
import { parsePaymentsQuery } from "@/features/payments/domain/url-state";

/** CSV of every payment matching the current filters and sort (not just the visible page). */
export function GET(request: NextRequest) {
  const query = parsePaymentsQuery(request.nextUrl.searchParams);
  const now = new Date();
  const rows = sortPayments(
    filterPayments(getPayments(now), query, now.getTime()),
    query.sort,
  );

  return new Response(paymentsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
