"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FlexRender } from "@tanstack/react-table";
import type { Payment, SortSpec } from "../domain/types";
import { REORDERABLE_COLUMN_IDS, type PaymentsTable } from "./columns";
import { EmptyRow } from "./EmptyRow";
import { HeaderCell } from "./HeaderCell";

/** Columns only move sideways. */
const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
});

const DRAG_ACTIVATION_DISTANCE = 6;

interface PaymentsGridProps {
  table: PaymentsTable;
  items: Payment[];
  sort: readonly SortSpec[];
}

export function PaymentsGrid({ table, items, sort }: PaymentsGridProps) {
  const sensors = useSensors(
    // A small threshold keeps a plain click on a header (sorting) from starting a drag.
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const visibleIds = table.getVisibleLeafColumns().map((column) => column.id);
  const reorderableIds = visibleIds.filter((id) =>
    REORDERABLE_COLUMN_IDS.has(id),
  );

  const labelOf = (id: string | number) =>
    table.getColumn(String(id))?.columnDef.meta?.label ?? String(id);
  const positionOf = (id: string | number) =>
    reorderableIds.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up the ${labelOf(active.id)} column.`,
    onDragOver: ({ active, over }) =>
      over
        ? `The ${labelOf(active.id)} column is over position ${positionOf(over.id)} of ${reorderableIds.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `The ${labelOf(active.id)} column was moved to position ${positionOf(over.id)} of ${reorderableIds.length}.`
        : `The ${labelOf(active.id)} column was dropped where it started.`,
    onDragCancel: ({ active }) =>
      `Moving the ${labelOf(active.id)} column was cancelled.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    // Reorder the full column list (hidden columns included) so the checkbox and actions columns
    // stay at the ends and hidden columns keep their relative position.
    const all = table.getAllLeafColumns().map((column) => column.id);
    const from = all.indexOf(String(active.id));
    const to = all.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    table.setColumnOrder(arrayMove(all, from, to));
  }

  return (
    <div
      role="region"
      aria-label="Payments"
      tabIndex={0}
      className="relative overflow-x-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To reorder a column, press Space, move it with the Left and Right arrow keys, then press Space to drop it or Escape to cancel. To resize it, hold Shift and press the Left or Right arrow key (add Alt for 1 pixel steps).",
          },
        }}
      >
        <table
          style={{
            width: table.getTotalSize(),
            minWidth: "100%",
            tableLayout: "fixed",
          }}
          className="border-collapse text-body"
        >
          <caption className="sr-only">Payments</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr
                key={group.id}
                className="h-[35px] border-t border-b border-t-border border-b-line text-left"
              >
                <SortableContext
                  items={reorderableIds}
                  strategy={horizontalListSortingStrategy}
                >
                  {group.headers.map((header) => (
                    <HeaderCell
                      key={header.id}
                      header={header}
                      table={table}
                      sort={sort}
                    />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {items.length === 0 && <EmptyRow colSpan={visibleIds.length} />}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-selected={row.getIsSelected() || undefined}
                className="h-[35px] border-b border-line hover:bg-subtle data-[selected]:bg-subtle"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className={`${cell.column.columnDef.meta?.className ?? ""} overflow-hidden whitespace-nowrap`}
                  >
                    <FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
