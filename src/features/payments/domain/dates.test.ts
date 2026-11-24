import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatRelativeTime,
  formatUtcOffset,
  formatWindowLabel,
  parseDateInput,
  resolveTimeWindow,
  startOfDayMs,
} from "./dates";

const ZONE = "America/Sao_Paulo"; // UTC-3, no DST since 2019
const utc = (iso: string) => Date.parse(iso);

describe("startOfDayMs", () => {
  it("returns local midnight, not UTC midnight", () => {
    // 2026-11-24 02:00 UTC is still 2026-11-23 23:00 in São Paulo.
    expect(startOfDayMs(utc("2026-11-24T02:00:00Z"), ZONE)).toBe(
      utc("2026-11-23T03:00:00Z"),
    );
    expect(startOfDayMs(utc("2026-11-24T03:00:00Z"), ZONE)).toBe(
      utc("2026-11-24T03:00:00Z"),
    );
  });

  it("handles a DST zone across the spring-forward day", () => {
    // New York: 2026-03-08 clocks jump 02:00 -> 03:00; midnight that day is UTC-5.
    expect(startOfDayMs(utc("2026-03-08T18:00:00Z"), "America/New_York")).toBe(
      utc("2026-03-08T05:00:00Z"),
    );
  });
});

describe("parseDateInput", () => {
  it("accepts real dates and rejects impossible or malformed ones", () => {
    expect(parseDateInput("2026-02-28")).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(parseDateInput("2026-02-31")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
    expect(parseDateInput("26-01-01")).toBeNull();
    expect(parseDateInput("2026-1-1")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });
});

describe("resolveTimeWindow", () => {
  const now = utc("2026-11-24T15:30:00Z"); // 12:30 in São Paulo

  it("today starts at local midnight and ends now", () => {
    expect(resolveTimeWindow("today", null, null, now, ZONE)).toEqual({
      start: utc("2026-11-24T03:00:00Z"),
      end: now,
    });
  });

  it("7d and 30d are trailing windows", () => {
    expect(resolveTimeWindow("7d", null, null, now, ZONE).start).toBe(
      now - 7 * 86_400_000,
    );
    expect(resolveTimeWindow("30d", null, null, now, ZONE).start).toBe(
      now - 30 * 86_400_000,
    );
  });

  it("4w is a trailing 28-day window", () => {
    expect(resolveTimeWindow("4w", null, null, now, ZONE).start).toBe(
      now - 28 * 86_400_000,
    );
  });

  it("month starts at local midnight on the 1st", () => {
    expect(resolveTimeWindow("month", null, null, now, ZONE)).toEqual({
      start: utc("2026-11-01T03:00:00Z"),
      end: now,
    });
  });

  it("last-month covers the whole previous calendar month, across a year boundary too", () => {
    expect(resolveTimeWindow("last-month", null, null, now, ZONE)).toEqual({
      start: utc("2026-10-01T03:00:00Z"),
      end: utc("2026-11-01T03:00:00Z") - 1,
    });
    const january = utc("2027-01-15T12:00:00Z");
    expect(resolveTimeWindow("last-month", null, null, january, ZONE)).toEqual({
      start: utc("2026-12-01T03:00:00Z"),
      end: utc("2027-01-01T03:00:00Z") - 1,
    });
  });

  it("all is unbounded", () => {
    expect(resolveTimeWindow("all", null, null, now, ZONE)).toEqual({
      start: null,
      end: null,
    });
  });

  it("custom is inclusive of the whole `to` day", () => {
    const window = resolveTimeWindow(
      "custom",
      "2026-11-01",
      "2026-11-20",
      now,
      ZONE,
    );
    expect(window.start).toBe(utc("2026-11-01T03:00:00Z"));
    expect(window.end).toBe(utc("2026-11-21T03:00:00Z") - 1);
  });

  it("custom supports a single open bound", () => {
    expect(resolveTimeWindow("custom", "2026-11-01", null, now, ZONE)).toEqual({
      start: utc("2026-11-01T03:00:00Z"),
      end: null,
    });
  });

  it("ignores reversed or invalid custom bounds instead of failing", () => {
    expect(
      resolveTimeWindow("custom", "2026-11-20", "2026-11-01", now, ZONE),
    ).toEqual({
      start: null,
      end: null,
    });
    expect(
      resolveTimeWindow("custom", "nope", "2026-13-40", now, ZONE),
    ).toEqual({
      start: null,
      end: null,
    });
  });
});

describe("formatDateTime", () => {
  const now = utc("2026-11-24T15:30:00Z");

  it("renders month, day and 12-hour time in the display zone", () => {
    expect(formatDateTime("2026-08-16T20:03:00Z", now, ZONE)).toBe(
      "Aug 16, 5:03 PM",
    );
  });

  it("adds the year only when it differs from the current year", () => {
    expect(formatDateTime("2025-08-16T20:03:00Z", now, ZONE)).toBe(
      "Aug 16, 2025, 5:03 PM",
    );
  });

  it("uses the display zone for the calendar day", () => {
    expect(formatDateTime("2026-08-17T01:30:00Z", now, ZONE)).toBe(
      "Aug 16, 10:30 PM",
    );
  });
});

describe("formatRelativeTime", () => {
  const now = utc("2026-11-24T15:30:00Z");

  it.each([
    ["2026-11-24T15:29:40Z", "now"],
    ["2026-11-24T15:25:00Z", "5 minutes ago"],
    ["2026-11-24T12:30:00Z", "3 hours ago"],
    ["2026-11-23T15:30:00Z", "yesterday"],
    ["2026-11-14T15:30:00Z", "10 days ago"],
    ["2026-11-24T15:35:00Z", "in 5 minutes"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

describe("window labels", () => {
  const now = utc("2026-11-24T15:30:00Z");

  it("labels single days and ranges in the given zone", () => {
    expect(
      formatWindowLabel(
        resolveTimeWindow("today", null, null, now, ZONE),
        ZONE,
      ),
    ).toBe("Nov 24");
    expect(
      formatWindowLabel(
        resolveTimeWindow("month", null, null, now, ZONE),
        ZONE,
      ),
    ).toBe("Nov 1–Nov 24");
    expect(
      formatWindowLabel(
        resolveTimeWindow("last-month", null, null, now, ZONE),
        ZONE,
      ),
    ).toBe("Oct 1–Oct 31");
    expect(
      formatWindowLabel(resolveTimeWindow("all", null, null, now, ZONE), ZONE),
    ).toBe("");
  });

  it("formats the UTC offset", () => {
    expect(formatUtcOffset(now, ZONE)).toBe("GMT-03:00");
    expect(formatUtcOffset(now, "UTC")).toBe("GMT+00:00");
  });
});
