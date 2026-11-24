"use client";

import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";
import type { Payment } from "../domain/types";
import type { tableFeaturesConfig } from "./columns";

type PaymentsTableInstance = Table<typeof tableFeaturesConfig, Payment>;

export function EditColumns({ table }: { table: PaymentsTableInstance }) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="gap-1 pr-[7px]">
          <Settings2 aria-hidden size={15} strokeWidth={2.25} />
          Edit columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[264px]">
        <fieldset>
          <legend className="mb-2 font-semibold text-ink-strong">
            Columns
          </legend>
          <ul className="flex flex-col">
            {columns.map((column) => {
              const label = column.columnDef.meta?.label ?? column.id;
              return (
                <li key={column.id}>
                  <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-1 hover:bg-subtle">
                    <Checkbox
                      aria-label={label}
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) =>
                        column.toggleVisibility(checked)
                      }
                    />
                    <span aria-hidden>{label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <Button
          className="mt-3 w-full justify-center"
          onClick={() => table.resetColumnVisibility()}
        >
          Reset to default
        </Button>
      </PopoverContent>
    </Popover>
  );
}
