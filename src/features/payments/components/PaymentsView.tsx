"use client";

import { useState } from "react";
import { useTable } from "@tanstack/react-table";
import { TooltipProvider } from "@/shared/ui/Tooltip";
import { ariaSortFor } from "../domain/sort";
import type { PageSize, Payment, SortKey, SortSpec } from "../domain/types";
import { columns, tableFeaturesConfig } from "./columns";
import { EditColumns } from "./EditColumns";
import { EmptyRow } from "./EmptyRow";
import { ExportLink } from "./ExportLink";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { StatusTiles } from "./StatusTiles";
import { PaymentsTableContext } from "./table-context";

const SORTABLE_COLUMNS: Record<string, SortKey> = {
  amount: "amount",
  status: "status",
  date: "date",
};

interface PaymentsViewProps {
  items: Payment[];
  sort: readonly SortSpec[];
  now: number;
  pagination: {
    firstIndex: number;
    lastIndex: number;
    total: number;
    page: number;
    pageCount: number;
    size: PageSize;
  };
}

export function PaymentsView({
  items,
  sort,
  now,
  pagination,
}: PaymentsViewProps) {
  const [announcement, setAnnouncement] = useState("");
  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: items,
    getRowId: (row) => row.id,
  });

  return (
    <PaymentsTableContext value={{ now, announce: setAnnouncement }}>
      <TooltipProvider>
        <StatusTiles />
        <div className="mt-[14px] mb-[9px] flex items-center justify-between gap-3 max-sm:flex-col">
          <FilterBar />
          <div className="flex shrink-0 items-center gap-[2px]">
            <ExportLink />
            <EditColumns table={table} />
          </div>
        </div>

        <div
          role="region"
          aria-label="Payments"
          tabIndex={0}
          className="relative overflow-x-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <table className="w-full min-w-max border-collapse text-body">
            <caption className="sr-only">Payments</caption>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr
                  key={group.id}
                  className="h-[35px] border-t border-b border-t-border border-b-line text-left"
                >
                  {group.headers.map((header) => {
                    const sortKey = SORTABLE_COLUMNS[header.column.id];
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          sortKey ? ariaSortFor(sort, sortKey) : undefined
                        }
                        className={`px-0 pt-[3px] text-xs font-semibold text-ink-strong ${header.column.columnDef.meta?.className ?? ""} ${header.column.columnDef.meta?.headerClassName ?? ""}`}
                      >
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {items.length === 0 && (
                <EmptyRow colSpan={table.getVisibleLeafColumns().length} />
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  className="h-[35px] border-b border-line hover:bg-subtle data-[selected]:bg-subtle"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`${cell.column.columnDef.meta?.className ?? ""} whitespace-nowrap`}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <Pagination {...pagination} />
      </TooltipProvider>
    </PaymentsTableContext>
  );
}
