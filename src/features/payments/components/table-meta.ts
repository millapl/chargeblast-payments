import type { CellData, RowData, TableFeatures } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  /* eslint-disable @typescript-eslint/no-unused-vars -- generics must match TanStack's declaration for the augmentation to merge */
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    className?: string;
    headerClassName?: string;
    /** Plain-text column name used by the "Edit columns" panel. */
    label?: string;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
