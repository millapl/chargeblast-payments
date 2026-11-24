import { describe, expect, it } from "vitest";
import { EXPORT_COLUMN_IDS } from "./csv";
import { exportColumnsForTable, parseExportOptions } from "./export-options";

const params = (query: string) => new URLSearchParams(query);

describe("parseExportOptions", () => {
  it("defaults to UTC and every column", () => {
    expect(parseExportOptions(params(""))).toEqual({
      timeZone: "utc",
      columns: EXPORT_COLUMN_IDS,
    });
  });

  it("accepts the display zone and a column subset, in canonical order", () => {
    expect(
      parseExportOptions(params("tz=zone&cols=customer,id,status")),
    ).toEqual({
      timeZone: "zone",
      columns: ["id", "status", "customer"],
    });
  });

  it("drops unknown values instead of failing", () => {
    expect(
      parseExportOptions(params("tz=Mars/Base&cols=password,__proto__,%00")),
    ).toEqual({
      timeZone: "utc",
      columns: EXPORT_COLUMN_IDS,
    });
    expect(parseExportOptions(params("cols=id,nope")).columns).toEqual(["id"]);
  });
});

describe("exportColumnsForTable", () => {
  it("maps visible table columns to CSV columns (amount also writes the currency)", () => {
    expect(exportColumnsForTable(["amount", "customer", "date"])).toEqual([
      "amount",
      "currency",
      "customer",
      "created",
    ]);
  });

  it("ignores columns without an export equivalent", () => {
    expect(exportColumnsForTable(["select", "actions"])).toEqual([]);
  });
});
