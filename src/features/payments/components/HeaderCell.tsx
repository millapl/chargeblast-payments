"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { FlexRender } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/lib/cn";
import { ariaSortFor } from "../domain/sort";
import type { SortKey, SortSpec } from "../domain/types";
import {
  REORDERABLE_COLUMN_IDS,
  type PaymentsHeader,
  type PaymentsTable,
} from "./columns";
import { usePaymentsTableContext } from "./table-context";

const SORTABLE_COLUMNS: Record<string, SortKey> = {
  amount: "amount",
  status: "status",
  date: "date",
};

const KEYBOARD_RESIZE_STEP = 10;

interface HeaderCellProps {
  header: PaymentsHeader;
  table: PaymentsTable;
  sort: readonly SortSpec[];
}

function ResizeHandle({ header }: { header: PaymentsHeader }) {
  const resize = header.getResizeHandler();
  const resizing = header.column.getIsResizing();
  return (
    <span
      aria-hidden
      data-resize-handle={header.column.id}
      // The column can be dragged by its header; resizing must not start a drag.
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={resize}
      onTouchStart={resize}
      onDoubleClick={() => header.column.resetSize()}
      className={cn(
        "absolute top-1 right-0 bottom-1 z-10 -mr-[3px] w-[7px] cursor-col-resize touch-none select-none",
        "after:absolute after:left-[3px] after:h-full after:w-px after:bg-transparent group-hover/th:after:bg-border hover:after:bg-accent",
        resizing && "after:w-0.5 after:bg-accent",
      )}
    />
  );
}

function HeaderCellView({
  header,
  table,
  sort,
  sortable,
}: HeaderCellProps & { sortable: boolean }) {
  const { announce } = usePaymentsTableContext();
  const column = header.column;
  const label = column.columnDef.meta?.label ?? column.id;
  const sortKey = SORTABLE_COLUMNS[column.id];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: !sortable });

  const style: CSSProperties = {
    width: header.getSize(),
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  function resizeBy(delta: number) {
    const next = Math.max(
      column.columnDef.minSize ?? 40,
      column.getSize() + delta,
    );
    table.setColumnSizing((previous) => ({ ...previous, [column.id]: next }));
    announce(`${label} column width ${next} pixels`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.shiftKey &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      const step = event.altKey ? 1 : KEYBOARD_RESIZE_STEP;
      resizeBy(event.key === "ArrowLeft" ? -step : step);
      return;
    }
    listeners?.onKeyDown?.(event);
  }

  return (
    <th
      ref={setNodeRef}
      scope="col"
      aria-sort={sortKey ? ariaSortFor(sort, sortKey) : undefined}
      style={style}
      onPointerDown={
        sortable ? (event) => listeners?.onPointerDown?.(event) : undefined
      }
      data-column-id={column.id}
      data-dragging={isDragging || undefined}
      className={cn(
        "group/th relative px-0 pt-[3px] text-xs font-semibold text-ink-strong",
        column.columnDef.meta?.className,
        column.columnDef.meta?.headerClassName,
        sortable &&
          "cursor-grab data-[dragging]:cursor-grabbing data-[dragging]:bg-white data-[dragging]:shadow-[0_4px_12px_rgba(48,49,61,0.18)]",
      )}
    >
      {header.isPlaceholder ? null : <FlexRender header={header} />}
      {sortable && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          onKeyDown={onKeyDown}
          aria-label={`Reorder or resize the ${label} column`}
          className="pointer-events-none absolute inset-0 rounded-sm opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-text"
        />
      )}
      {column.getCanResize() && <ResizeHandle header={header} />}
    </th>
  );
}

export function HeaderCell(props: HeaderCellProps) {
  return (
    <HeaderCellView
      {...props}
      sortable={REORDERABLE_COLUMN_IDS.has(props.header.column.id)}
    />
  );
}
