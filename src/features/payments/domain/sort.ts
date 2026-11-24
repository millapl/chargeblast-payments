import { DEFAULT_SORT } from "./query";
import type { SortDirection, SortKey, SortSpec } from "./types";

const FIRST_DIRECTION: Record<SortKey, SortDirection> = {
  date: "desc",
  amount: "desc",
  status: "asc",
};

/**
 * Header click behaviour (single-column sorting, REQ-SORT-04): clicking a different column
 * sorts by it in its natural first direction; clicking the primary column flips direction.
 */
export function nextSort(
  current: readonly SortSpec[],
  key: SortKey,
): SortSpec[] {
  const primary = (current.length > 0 ? current : DEFAULT_SORT)[0];
  if (primary.key === key) {
    return [{ key, dir: primary.dir === "asc" ? "desc" : "asc" }];
  }
  return [{ key, dir: FIRST_DIRECTION[key] }];
}

/** `aria-sort` value for a column given the active sort. Only the primary key is announced. */
export function ariaSortFor(
  current: readonly SortSpec[],
  key: SortKey,
): "ascending" | "descending" | "none" {
  const primary = (current.length > 0 ? current : DEFAULT_SORT)[0];
  if (primary.key !== key) return "none";
  return primary.dir === "asc" ? "ascending" : "descending";
}
