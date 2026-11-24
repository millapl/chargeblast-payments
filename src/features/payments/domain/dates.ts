import type { DateRange } from "./types";

/** All absolute dates and day boundaries use this zone (ADR-008). */
export const DISPLAY_TIME_ZONE = "America/Sao_Paulo";

const LOCALE = "en-US";
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

function zonedParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(ms);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function zoneOffsetMs(ms: number, timeZone: string): number {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** UTC milliseconds of 00:00:00.000 on the given calendar date in `timeZone`. */
function localMidnightMs(
  { year, month, day }: LocalDate,
  timeZone: string,
): number {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - zoneOffsetMs(guess, timeZone);
  const second = guess - zoneOffsetMs(first, timeZone);
  return second;
}

/** Local midnight of the first day of the month `monthOffset` months from `ms`'s month. */
export function startOfMonthMs(
  ms: number,
  timeZone: string = DISPLAY_TIME_ZONE,
  monthOffset = 0,
): number {
  const { year, month } = zonedParts(ms, timeZone);
  // Date.UTC normalises month overflow/underflow (month 0 = December of the previous year).
  const normalised = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  return localMidnightMs(
    {
      year: normalised.getUTCFullYear(),
      month: normalised.getUTCMonth() + 1,
      day: 1,
    },
    timeZone,
  );
}

export function startOfDayMs(
  ms: number,
  timeZone: string = DISPLAY_TIME_ZONE,
): number {
  const { year, month, day } = zonedParts(ms, timeZone);
  return localMidnightMs({ year, month, day }, timeZone);
}

/** Parses `YYYY-MM-DD`, rejecting impossible dates such as 2026-02-31. */
export function parseDateInput(input: string): LocalDate | null {
  const match = DATE_INPUT.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return valid ? { year, month, day } : null;
}

export interface TimeWindow {
  /** Inclusive lower bound in UTC ms, or `null` for unbounded. */
  start: number | null;
  /** Inclusive upper bound in UTC ms, or `null` for unbounded. */
  end: number | null;
}

/**
 * Resolves a date-range selection to a UTC window.
 * - `today`: from local midnight until `now`.
 * - `7d` / `30d` / `4w`: trailing 7 / 30 / 28 × 24 h until `now`.
 * - `month`: local start of the current month until `now`; `last-month`: the whole previous month.
 * - `custom`: local start of `from` through local end of `to` (both inclusive). Invalid or
 *   reversed bounds are ignored (unbounded) so malformed URLs never break the view.
 */
export function resolveTimeWindow(
  range: DateRange,
  from: string | null,
  to: string | null,
  now: number,
  timeZone: string = DISPLAY_TIME_ZONE,
): TimeWindow {
  switch (range) {
    case "all":
      return { start: null, end: null };
    case "today":
      return { start: startOfDayMs(now, timeZone), end: now };
    case "7d":
      return { start: now - 7 * DAY_MS, end: now };
    case "30d":
      return { start: now - 30 * DAY_MS, end: now };
    case "4w":
      return { start: now - 28 * DAY_MS, end: now };
    case "month":
      return { start: startOfMonthMs(now, timeZone, 0), end: now };
    case "last-month":
      return {
        start: startOfMonthMs(now, timeZone, -1),
        end: startOfMonthMs(now, timeZone, 0) - 1,
      };
    case "custom": {
      const fromDate = from ? parseDateInput(from) : null;
      const toDate = to ? parseDateInput(to) : null;
      const start = fromDate ? localMidnightMs(fromDate, timeZone) : null;
      const end = toDate
        ? localMidnightMs({ ...toDate, day: toDate.day + 1 }, timeZone) - 1
        : null;
      if (start !== null && end !== null && start > end)
        return { start: null, end: null };
      return { start, end };
    }
  }
}

/** `2026-11-24 09:30:05` in `timeZone` (used by the CSV export). */
export function formatLocalTimestamp(
  iso: string,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  const p = zonedParts(Date.parse(iso), timeZone);
  const two = (value: number) => String(value).padStart(2, "0");
  return `${p.year}-${two(p.month)}-${two(p.day)} ${two(p.hour)}:${two(p.minute)}:${two(p.second)}`;
}

/** `Aug 16, 5:03 PM`; the year is added only when it differs from `now`'s year. */
export function formatDateTime(
  iso: string,
  now: number,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  const ms = Date.parse(iso);
  const sameYear =
    zonedParts(ms, timeZone).year === zonedParts(now, timeZone).year;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(ms);
}

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", DAY_MS],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "3 hours ago", "yesterday", "in 5 minutes", "just now" (< 1 minute). */
export function formatRelativeTime(iso: string, now: number): string {
  const diff = Date.parse(iso) - now;
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (abs >= size) return formatter.format(Math.round(diff / size), unit);
  }
  return formatter.format(0, "second");
}

/** `GMT-03:00` for `timeZone` at `at`. */
export function formatUtcOffset(
  at: number,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  const part = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((candidate) => candidate.type === "timeZoneName");
  return part?.value ?? "GMT";
}

/** `Nov 24` or `Nov 1–Nov 24`; empty for an unbounded window. */
export function formatWindowLabel(
  window: TimeWindow,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  if (window.start === null || window.end === null) return "";
  const format = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    month: "short",
    day: "numeric",
  });
  const start = format.format(window.start);
  const end = format.format(window.end);
  return start === end ? start : `${start}–${end}`;
}
