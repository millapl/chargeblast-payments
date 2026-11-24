import {
  EXPORT_COLUMN_IDS,
  type CsvOptions,
  type ExportColumnId,
  type ExportTimeZone,
} from "./csv";

/** Table column id -> CSV columns it contributes. */
const TABLE_TO_EXPORT: Record<string, readonly ExportColumnId[]> = {
  paymentId: ["id"],
  amount: ["amount", "currency"],
  status: ["status"],
  method: ["method"],
  description: ["description"],
  customer: ["customer"],
  date: ["created"],
  refundedAt: ["refunded"],
  declineReason: ["decline"],
};

/** CSV columns matching the table columns that are currently visible. */
export function exportColumnsForTable(
  visibleTableColumnIds: readonly string[],
): ExportColumnId[] {
  const wanted = new Set(
    visibleTableColumnIds.flatMap((id) => TABLE_TO_EXPORT[id] ?? []),
  );
  return EXPORT_COLUMN_IDS.filter((id) => wanted.has(id));
}

const TIME_ZONES: readonly ExportTimeZone[] = ["utc", "zone"];

/**
 * Reads `tz` and `cols` from untrusted query parameters. Unknown values are dropped:
 * a missing or invalid `tz` means UTC, and no valid `cols` means every column.
 */
export function parseExportOptions(
  params: URLSearchParams,
): Required<CsvOptions> {
  const tz = params.get("tz");
  const timeZone = TIME_ZONES.find((value) => value === tz) ?? "utc";
  const requested = (params.get("cols") ?? "").split(",");
  const columns = EXPORT_COLUMN_IDS.filter((id) => requested.includes(id));
  return {
    timeZone,
    columns: columns.length > 0 ? columns : EXPORT_COLUMN_IDS,
  };
}
