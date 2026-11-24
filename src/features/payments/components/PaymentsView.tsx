"use client";

import { useState } from "react";
import { useTable } from "@tanstack/react-table";
import { TooltipProvider } from "@/shared/ui/Tooltip";
import type { PageSize, Payment, SortSpec } from "../domain/types";
import { columns, tableFeaturesConfig } from "./columns";
import { EditColumns } from "./EditColumns";
import { ExportDialog } from "./ExportDialog";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { PaymentsGrid } from "./PaymentsGrid";
import { StatusTiles } from "./StatusTiles";
import { PaymentsTableContext } from "./table-context";

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
          <div className="flex shrink-0 items-center gap-1.5">
            <ExportDialog
              visibleColumnIds={table
                .getVisibleLeafColumns()
                .map((column) => column.id)}
            />
            <EditColumns table={table} />
          </div>
        </div>

        <PaymentsGrid table={table} items={items} sort={sort} />
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <Pagination {...pagination} />
      </TooltipProvider>
    </PaymentsTableContext>
  );
}
