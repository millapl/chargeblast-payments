import { describe, expect, it } from "vitest";
import { ariaSortFor, nextSort } from "./sort";

describe("nextSort", () => {
  it("starts a new column in its natural first direction", () => {
    expect(nextSort([{ key: "date", dir: "desc" }], "amount")).toEqual([
      { key: "amount", dir: "desc" },
    ]);
    expect(nextSort([{ key: "date", dir: "desc" }], "status")).toEqual([
      { key: "status", dir: "asc" },
    ]);
  });

  it("flips the direction of the primary column", () => {
    expect(nextSort([{ key: "amount", dir: "desc" }], "amount")).toEqual([
      { key: "amount", dir: "asc" },
    ]);
    expect(nextSort([{ key: "amount", dir: "asc" }], "amount")).toEqual([
      { key: "amount", dir: "desc" },
    ]);
  });

  it("treats an empty sort as the default (date descending)", () => {
    expect(nextSort([], "date")).toEqual([{ key: "date", dir: "asc" }]);
  });

  it("drops secondary keys when re-sorting from the UI", () => {
    expect(
      nextSort(
        [
          { key: "status", dir: "asc" },
          { key: "date", dir: "desc" },
        ],
        "date",
      ),
    ).toEqual([{ key: "date", dir: "desc" }]);
  });
});

describe("ariaSortFor", () => {
  it("announces only the primary sort key", () => {
    const sort = [
      { key: "amount", dir: "asc" },
      { key: "date", dir: "desc" },
    ] as const;
    expect(ariaSortFor(sort, "amount")).toBe("ascending");
    expect(ariaSortFor(sort, "date")).toBe("none");
    expect(ariaSortFor(sort, "status")).toBe("none");
  });

  it("falls back to the default sort", () => {
    expect(ariaSortFor([], "date")).toBe("descending");
  });
});
