import { ChartColumn, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";

export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h1 className="text-title font-bold text-ink-strong">{title}</h1>
      <div className="flex items-center gap-1.5">
        <Button
          variant="primary"
          className="gap-[7px] pr-2 font-bold shadow-[inset_0_-1px_0_rgba(0,0,0,0.16)]"
        >
          <Plus
            aria-hidden
            size={18}
            strokeWidth={2.25}
            className="-mx-[3.5px]"
          />
          Create payment
        </Button>
        <Button className="gap-[5.5px]">
          <ChartColumn
            aria-hidden
            size={14}
            strokeWidth={2}
            className="-mx-px"
          />
          Analyze
        </Button>
      </div>
    </div>
  );
}
