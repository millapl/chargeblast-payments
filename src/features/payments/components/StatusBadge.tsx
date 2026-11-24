import {
  Check,
  CircleDashed,
  CircleMinus,
  Clock,
  TriangleAlert,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { STATUS_LABELS } from "../domain/labels";
import type { PaymentStatus } from "../domain/types";

const TONES = {
  success: "border-success-border bg-success-bg text-success-text",
  danger: "border-danger-border bg-danger-bg text-danger-text",
  neutral: "border-border bg-subtle text-muted",
} as const;

const STATUS_STYLE: Record<
  PaymentStatus,
  { tone: keyof typeof TONES; icon: LucideIcon }
> = {
  succeeded: { tone: "success", icon: Check },
  failed: { tone: "danger", icon: X },
  blocked: { tone: "danger", icon: CircleMinus },
  canceled: { tone: "neutral", icon: X },
  pending: { tone: "neutral", icon: Clock },
  refunded: { tone: "neutral", icon: Undo2 },
  disputed: { tone: "danger", icon: TriangleAlert },
  uncaptured: { tone: "neutral", icon: CircleDashed },
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { tone, icon: Icon } = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-[5px] rounded-sm border px-[5px] text-[11.5px] font-normal whitespace-nowrap",
        TONES[tone],
      )}
    >
      {STATUS_LABELS[status]}
      <Icon aria-hidden size={13} strokeWidth={2.75} />
    </span>
  );
}
