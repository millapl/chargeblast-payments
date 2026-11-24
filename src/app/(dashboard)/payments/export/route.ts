import type { NextRequest } from "next/server";
import { getPayments } from "@/features/payments/data/repository";
import { paymentsToCsv } from "@/features/payments/domain/csv";
import { DISPLAY_TIME_ZONE } from "@/features/payments/domain/dates";
import { parseExportOptions } from "@/features/payments/domain/export-options";
import { filterPayments, sortPayments } from "@/features/payments/domain/query";
import { parsePaymentsQuery } from "@/features/payments/domain/url-state";

/**
 * CSV of every payment matching the query (filters, date range, sort), not just the visible
 * page. `tz` (utc | zone) and `cols` (comma-separated column ids) shape the file.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = parsePaymentsQuery(params);
  const options = parseExportOptions(params);
  const now = new Date();
  const zone = options.timeZone === "utc" ? "UTC" : DISPLAY_TIME_ZONE;
  const rows = sortPayments(
    filterPayments(getPayments(now), query, now.getTime(), zone),
    query.sort,
  );

  return new Response(paymentsToCsv(rows, options), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
