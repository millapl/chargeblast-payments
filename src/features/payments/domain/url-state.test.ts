import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY } from "./query";
import { parsePaymentsQuery, serializePaymentsSearchParams } from "./url-state";

describe("parsePaymentsQuery", () => {
  it("returns defaults for an empty URL", () => {
    expect(parsePaymentsQuery(new URLSearchParams())).toEqual(DEFAULT_QUERY);
  });

  it("parses a full valid URL", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams(
        "status=succeeded,failed&method=card&currency=USD,BRL&range=custom&from=2026-11-01&to=2026-11-20&min=5&max=99.50&q=ada&sort=amount:asc,date:desc&page=3&size=50",
      ),
    );
    expect(query).toEqual({
      status: ["succeeded", "failed"],
      method: ["card"],
      currency: ["USD", "BRL"],
      range: "custom",
      from: "2026-11-01",
      to: "2026-11-20",
      min: "5",
      max: "99.50",
      q: "ada",
      sort: [
        { key: "amount", dir: "asc" },
        { key: "date", dir: "desc" },
      ],
      page: 3,
      size: 50,
    });
  });

  it("drops invalid values to defaults without throwing", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams(
        "status=hacked,succeeded&method=crypto&currency=XXX&range=forever&size=1000&page=abc&sort=password:asc,date:sideways&min=1e9&max=-5",
      ),
    );
    expect(query).toEqual({ ...DEFAULT_QUERY, status: ["succeeded"] });
  });

  it("ignores from/to unless the range is custom", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams("range=7d&from=2026-11-01&to=2026-11-02"),
    );
    expect(query.from).toBeNull();
    expect(query.to).toBeNull();
  });

  it("rejects malformed custom dates", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams("range=custom&from=yesterday&to=2026-1-1"),
    );
    expect(query.from).toBeNull();
    expect(query.to).toBeNull();
  });

  it("de-duplicates list values and sort keys, and caps sort keys", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams(
        "status=failed,failed,failed&sort=date:asc,date:desc,amount:asc,status:desc",
      ),
    );
    expect(query.status).toEqual(["failed"]);
    expect(query.sort).toEqual([
      { key: "date", dir: "asc" },
      { key: "amount", dir: "asc" },
      { key: "status", dir: "desc" },
    ]);
  });

  it("trims and length-caps the search term", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams({ q: `  ${"a".repeat(500)}  ` }),
    );
    expect(query.q).toBe("a".repeat(64));
  });

  it("clamps page numbers", () => {
    expect(parsePaymentsQuery(new URLSearchParams("page=0")).page).toBe(1);
    expect(parsePaymentsQuery(new URLSearchParams("page=-7")).page).toBe(1);
    expect(
      parsePaymentsQuery(new URLSearchParams("page=99999999999")).page,
    ).toBeLessThanOrEqual(100_000);
  });

  it("is safe against prototype-pollution style keys and unknown params", () => {
    const query = parsePaymentsQuery(
      new URLSearchParams("__proto__=x&constructor=y&foo=bar"),
    );
    expect(query).toEqual(DEFAULT_QUERY);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it("accepts the plain-object shape produced by Next.js searchParams", () => {
    const query = parsePaymentsQuery({
      status: ["failed"],
      page: "2",
      q: undefined,
    });
    expect(query.page).toBe(2);
  });

  it("round-trips through the serializer and omits defaults", () => {
    const url = serializePaymentsSearchParams("/payments", {
      status: ["failed"],
      size: 50,
      page: 1,
    });
    expect(url).toBe("/payments?status=failed&size=50");
    const roundTrip = parsePaymentsQuery(
      new URL(url, "http://localhost").searchParams,
    );
    expect(roundTrip).toMatchObject({ status: ["failed"], size: 50, page: 1 });
  });
});
