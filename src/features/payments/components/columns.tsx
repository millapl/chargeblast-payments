"use client";

import {
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
});

const helper = createColumnHelper<typeof tableFeaturesConfig, Payment>();

export const columns = helper.columns([
  helper.display({
    id: "select",
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
    meta: { className: "w-10 pl-[5px]" },
  }),
  helper.accessor("amountMinor", {
    id: "amount",
    header: () => <SortHeader sortKey="amount" align="right" />,
    cell: ({ row }) => (
      <span className="flex items-baseline gap-[13px]">
        <span className="flex w-[63px] justify-end font-semibold text-ink tabular-nums">
          {formatMoney(row.original.amountMinor, row.original.currency)}
        </span>
        <span className="w-7 text-muted">{row.original.currency}</span>
      </span>
    ),
    meta: {
      label: "Amount",
      className: "w-[112px]",
      headerClassName: "pr-[49px] text-right",
    },
  }),
  helper.accessor("status", {
    id: "status",
    header: () => <SortHeader sortKey="status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: "Status", className: "w-[118px] pl-[3px]" },
  }),
  helper.display({
    id: "method",
    header: "Payment method",
    cell: ({ row }) => <PaymentMethodCell method={row.original.method} />,
    meta: { label: "Payment method", className: "w-[125px]" },
  }),
  helper.accessor("description", {
    id: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted">{row.original.description}</span>
    ),
    meta: { label: "Description", className: "w-[148px] pl-2" },
  }),
  helper.display({
    id: "paymentId",
    header: "Payment ID",
    cell: ({ row }) => <PaymentIdCell id={row.original.id} />,
    meta: { label: "Payment ID", className: "w-[150px] pl-2" },
  }),
  helper.accessor("customerEmail", {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <span className="block truncate text-muted">
        {row.original.customerEmail}
      </span>
    ),
    meta: { label: "Customer", className: "w-[255px] max-w-[255px] pl-2" },
  }),
  helper.accessor("createdAt", {
    id: "date",
    header: () => <SortHeader sortKey="date" />,
    cell: ({ row }) => <DateCell iso={row.original.createdAt} />,
    meta: { label: "Date", className: "w-[130px] pl-2" },
  }),
  helper.accessor("refundedAt", {
    id: "refundedAt",
    header: "Refunded date",
    cell: ({ row }) => <OptionalDateCell iso={row.original.refundedAt} />,
    meta: { label: "Refunded date", className: "w-[130px] pl-2" },
  }),
  helper.accessor("declineReason", {
    id: "declineReason",
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
      className: "w-[170px] max-w-[170px] pl-2",
    },
  }),
  helper.display({
    id: "actions",
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
    meta: { className: "w-10 pl-1" },
  }),
]);
