"use client";

import { useId, useState } from "react";
import { Button, buttonStyles } from "@/shared/ui/Button";
import { StripeIcon } from "@/shared/ui/StripeIcon";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/Dialog";
import {
  EXPORT_COLUMN_IDS,
  exportColumnHeader,
  type ExportTimeZone,
} from "../domain/csv";
import {
  DISPLAY_TIME_ZONE,
  formatUtcOffset,
  formatWindowLabel,
  parseDateInput,
  resolveTimeWindow,
} from "../domain/dates";
import { exportColumnsForTable } from "../domain/export-options";
import { DATE_RANGE_LABELS, summarizeDate } from "../domain/filter-summary";
import type { DateRange } from "../domain/types";
import {
  serializePaymentsSearchParams,
  toPaymentsQuery,
} from "../domain/url-state";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";
import { TextInput } from "./filters/TextInput";
import { usePaymentsTableContext } from "./table-context";

type RangeChoice =
  | "view"
  | Extract<
      DateRange,
      "today" | "month" | "7d" | "4w" | "last-month" | "all" | "custom"
    >;

const RANGE_CHOICES: readonly RangeChoice[] = [
  "view",
  "today",
  "month",
  "7d",
  "4w",
  "last-month",
  "all",
  "custom",
];

const RANGE_TEXT: Record<RangeChoice, string> = {
  view: "Current view",
  today: DATE_RANGE_LABELS.today,
  month: DATE_RANGE_LABELS.month,
  "7d": "Last 7 days",
  "4w": DATE_RANGE_LABELS["4w"],
  "last-month": DATE_RANGE_LABELS["last-month"],
  all: "All",
  custom: DATE_RANGE_LABELS.custom,
};

interface ExportFormProps {
  visibleColumnIds: readonly string[];
  onExport: () => void;
}

function ExportForm({ visibleColumnIds, onExport }: ExportFormProps) {
  const id = useId();
  const [values] = usePaymentsUrlState();
  const query = toPaymentsQuery(values);
  const { now } = usePaymentsTableContext();

  const [timeZone, setTimeZone] = useState<ExportTimeZone>("zone");
  const [range, setRange] = useState<RangeChoice>("view");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [columnMode, setColumnMode] = useState<"default" | "table">("default");

  const zoneId = timeZone === "utc" ? "UTC" : DISPLAY_TIME_ZONE;
  const tableColumns = exportColumnsForTable(visibleColumnIds);
  const columns = columnMode === "table" ? tableColumns : EXPORT_COLUMN_IDS;

  const start = from === "" ? null : parseDateInput(from);
  const end = to === "" ? null : parseDateInput(to);
  const customError =
    range !== "custom"
      ? null
      : (from !== "" && !start) || (to !== "" && !end)
        ? "Enter valid dates."
        : !start && !end
          ? "Choose a start date, an end date, or both."
          : from !== "" && to !== "" && from > to
            ? "The start date must not be after the end date."
            : null;
  const invalid = customError !== null || columns.length === 0;

  function rangeNote(choice: RangeChoice): string {
    if (choice === "view")
      return summarizeDate(query) || "Table date filter (none set)";
    if (choice === "custom") return "";
    return formatWindowLabel(
      resolveTimeWindow(choice, null, null, now, zoneId),
      zoneId,
    );
  }

  const exportRange: DateRange = range === "view" ? query.range : range;
  const dateParams =
    range === "view"
      ? { range: query.range, from: query.from, to: query.to }
      : {
          range: exportRange,
          from: range === "custom" ? from || null : null,
          to: range === "custom" ? to || null : null,
        };
  const base = serializePaymentsSearchParams("/payments/export", {
    status: [...query.status],
    method: [...query.method],
    currency: [...query.currency],
    min: query.min,
    max: query.max,
    q: query.q,
    sort: query.sort.map((spec) => `${spec.key}:${spec.dir}`),
    ...dateParams,
  });
  const extra = new URLSearchParams({ tz: timeZone });
  if (columnMode === "table") extra.set("cols", columns.join(","));
  const href = `${base}${base.includes("?") ? "&" : "?"}${extra.toString()}`;

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-[13px] pt-3 pb-4">
        <DialogDescription className="rounded-md bg-subtle p-3 text-muted">
          Filters applied to the table (status, payment method, currency, amount
          and search) also apply to the file. A date range chosen here replaces
          the table&apos;s date filter.
        </DialogDescription>

        <fieldset className="mt-5">
          <legend className="mb-1.5 text-body text-ink">Time zone</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {(["zone", "utc"] as const).map((choice) => (
              <label
                key={choice}
                className="flex h-7 cursor-pointer items-center gap-2 font-semibold"
              >
                <input
                  type="radio"
                  name={`${id}-tz`}
                  checked={timeZone === choice}
                  onChange={() => setTimeZone(choice)}
                  className="size-4 accent-accent"
                />
                {choice === "utc"
                  ? "UTC"
                  : `${formatUtcOffset(now, DISPLAY_TIME_ZONE)} (${DISPLAY_TIME_ZONE})`}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-1.5 text-body text-ink">Date range</legend>
          <ul>
            {RANGE_CHOICES.map((choice) => (
              <li
                key={choice}
                className="grid grid-cols-[190px_1fr] items-center max-sm:grid-cols-1"
              >
                <label className="flex h-7 cursor-pointer items-center gap-2 font-semibold">
                  <input
                    type="radio"
                    name={`${id}-range`}
                    checked={range === choice}
                    onChange={() => setRange(choice)}
                    className="size-4 accent-accent"
                  />
                  {RANGE_TEXT[choice]}
                </label>
                <span className="text-muted max-sm:pl-6">
                  {rangeNote(choice)}
                </span>
              </li>
            ))}
          </ul>
          {range === "custom" && (
            <div className="mt-2 grid max-w-[360px] grid-cols-2 gap-2 pl-6">
              <TextInput
                id={`${id}-from`}
                label="From"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <TextInput
                id={`${id}-to`}
                label="To"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          )}
          {customError && (
            <p role="alert" className="mt-2 pl-6 text-xs text-danger-text">
              {customError}
            </p>
          )}
        </fieldset>

        <div className="mt-5">
          <label
            htmlFor={`${id}-columns`}
            className="mb-1.5 block text-body text-ink"
          >
            Columns
          </label>
          <select
            id={`${id}-columns`}
            value={columnMode}
            onChange={(event) =>
              setColumnMode(
                event.target.value === "table" ? "table" : "default",
              )
            }
            className="h-[30px] rounded-md bg-white px-2 text-body font-semibold text-ink ring-1 ring-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            <option value="default">
              Default ({EXPORT_COLUMN_IDS.length})
            </option>
            <option value="table">Table columns ({tableColumns.length})</option>
          </select>
          <p className="mt-2 text-muted">
            {columns.length > 0
              ? columns
                  .map((column) => exportColumnHeader(column, timeZone))
                  .join(", ")
              : "No exportable columns are visible in the table."}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-[13px] py-3">
        <span className="text-xs text-muted">CSV, UTF-8</span>
        <div className="flex items-center gap-1.5">
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          {invalid ? (
            <Button variant="primary" disabled>
              Export
            </Button>
          ) : (
            <a
              href={href}
              download="payments.csv"
              onClick={onExport}
              className={buttonStyles("primary")}
            >
              Export
            </a>
          )}
        </div>
      </div>
    </form>
  );
}

export function ExportDialog({
  visibleColumnIds,
}: {
  visibleColumnIds: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 pr-2.5 pl-2.5">
          <StripeIcon name="export" size={14} />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent title="Export payments">
        <ExportForm
          visibleColumnIds={visibleColumnIds}
          onExport={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
