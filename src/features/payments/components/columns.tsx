"use client";

import {
  type Header,
  type Table,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { Checkbox } from "@/shared/ui/Checkbox";
import { formatMoney } from "../domain/money";
import type { Payment } from "../domain/types";
import { DateCell, EmptyValue, OptionalDateCell } from "./DateCell";
import { PaymentIdCell } from "./PaymentIdCell";
import { PaymentMethodCell } from "./PaymentMethodCell";
import { SortHeader } from "./SortHeader";
import { StatusBadge } from "./StatusBadge";

export const tableFeaturesConfig = tableFeatures({
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
});

export type PaymentsTable = Table<typeof tableFeaturesConfig, Payment>;
export type PaymentsHeader = Header<
  typeof tableFeaturesConfig,
  Payment,
  unknown
>;

/** Columns the user can drag to reorder; the checkbox and actions columns stay at the ends. */
export const REORDERABLE_COLUMN_IDS: ReadonlySet<string> = new Set([
  "amount",
  "status",
  "method",
  "description",
  "paymentId",
  "customer",
  "date",
  "refundedAt",
  "declineReason",
]);

const helper = createColumnHelper<typeof tableFeaturesConfig, Payment>();

export const columns = helper.columns([
  helper.display({
    id: "select",
    size: 40,
    minSize: 40,
    enableResizing: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all payments on this page"
        checked={
          table.getIsAllRowsSelected()
            ? true
            : table.getIsSomeRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select payment ${row.original.id}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    meta: { className: "pl-[5px]" },
  }),
  helper.accessor("amountMinor", {
    id: "amount",
    size: 123,
    minSize: 80,
    header: () => <SortHeader sortKey="amount" align="right" />,
    cell: ({ row }) => (
      <span className="flex items-baseline gap-[13px]">
        <span className="flex flex-1 justify-end font-semibold text-ink tabular-nums">
          {formatMoney(row.original.amountMinor, row.original.currency)}
        </span>
        <span className="w-7 shrink-0 text-muted">{row.original.currency}</span>
      </span>
    ),
    meta: {
      label: "Amount",
      className: "",
      headerClassName: "pr-[49px] text-right",
    },
  }),
  helper.accessor("status", {
    id: "status",
    size: 118,
    minSize: 80,
    header: () => <SortHeader sortKey="status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: "Status", className: "pl-[3px]" },
  }),
  helper.display({
    id: "method",
    size: 133,
    minSize: 90,
    header: "Payment method",
    cell: ({ row }) => <PaymentMethodCell method={row.original.method} />,
    meta: { label: "Payment method", className: "pl-2" },
  }),
  helper.accessor("description", {
    id: "description",
    size: 148,
    minSize: 80,
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted">{row.original.description}</span>
    ),
    meta: { label: "Description", className: "pl-2" },
  }),
  helper.display({
    id: "paymentId",
    size: 150,
    minSize: 90,
    header: "Payment ID",
    cell: ({ row }) => <PaymentIdCell id={row.original.id} />,
    meta: { label: "Payment ID", className: "pl-2" },
  }),
  helper.accessor("customerEmail", {
    id: "customer",
    size: 244,
    minSize: 100,
    header: "Customer",
    cell: ({ row }) => (
      <span className="block truncate text-muted">
        {row.original.customerEmail}
      </span>
    ),
    meta: { label: "Customer", className: "pl-2" },
  }),
  helper.accessor("createdAt", {
    id: "date",
    size: 130,
    minSize: 90,
    header: () => <SortHeader sortKey="date" />,
    cell: ({ row }) => <DateCell iso={row.original.createdAt} />,
    meta: { label: "Date", className: "pl-2" },
  }),
  helper.accessor("refundedAt", {
    id: "refundedAt",
    size: 130,
    minSize: 90,
    header: "Refunded date",
    cell: ({ row }) => <OptionalDateCell iso={row.original.refundedAt} />,
    meta: { label: "Refunded date", className: "pl-2" },
  }),
  helper.accessor("declineReason", {
    id: "declineReason",
    size: 170,
    minSize: 90,
    header: "Decline reason",
    cell: ({ row }) =>
      row.original.declineReason === null ? (
        <EmptyValue />
      ) : (
        <span className="block truncate text-muted">
          {row.original.declineReason}
        </span>
      ),
    meta: {
      label: "Decline reason",
      className: "pl-2",
    },
  }),
  helper.display({
    id: "actions",
    size: 40,
    minSize: 40,
    enableResizing: false,
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <button
        type="button"
        aria-label={`More actions for payment ${row.original.id}`}
        className="flex size-6 items-center justify-center rounded-sm text-icon hover:bg-line focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        <Ellipsis aria-hidden size={16} />
      </button>
    ),
    meta: { className: "pl-1" },
  }),
]);
