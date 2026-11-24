import { ChartNoAxesColumn, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";

export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h1 className="text-title font-bold text-ink-strong">{title}</h1>
      <div className="flex items-center gap-[3px]">
        <Button
          variant="primary"
          className="gap-2 pr-1.5 pl-2 text-[13.5px] font-bold shadow-[inset_0_-1px_0_rgba(0,0,0,0.16)]"
        >
          <Plus aria-hidden size={13} strokeWidth={3} />
          Create payment
        </Button>
        <Button className="gap-[5px] pr-[7px] pl-[16px] text-[13.5px]">
          <ChartNoAxesColumn aria-hidden size={14} strokeWidth={2.5} />
          Analyze
        </Button>
      </div>
    </div>
  );
}
