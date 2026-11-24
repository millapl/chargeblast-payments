"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { Tooltip } from "@/shared/ui/Tooltip";
import { shortenPaymentId } from "../domain/money";
import { usePaymentsTableContext } from "./table-context";

const RESET_MS = 1600;

export function PaymentIdCell({ id }: { id: string }) {
  const { announce } = usePaymentsTableContext();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      next = "failed";
    }
    setState(next);
    announce(
      next === "copied"
        ? "Payment ID copied to clipboard"
        : "Could not copy payment ID",
    );
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), RESET_MS);
  }

  const label =
    state === "copied"
      ? "Copied"
      : state === "failed"
        ? "Copy failed"
        : "Copy payment ID";

  return (
    <span className="group/id flex items-center gap-1">
      <Link
        href={`/payments/${id}`}
        prefetch={false}
        className="rounded-sm font-mono text-xs text-muted hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
      >
        <span aria-hidden>{shortenPaymentId(id)}</span>
        <span className="sr-only">{id}</span>
      </Link>
      <Tooltip content={label}>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy payment ID ${id}`}
          className="flex size-5 items-center justify-center rounded-sm text-icon opacity-0 group-focus-within/id:opacity-100 group-hover/id:opacity-100 hover:bg-line focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent-text"
        >
          {state === "copied" ? (
            <Check
              aria-hidden
              size={12}
              strokeWidth={2.5}
              className="text-success-text"
            />
          ) : (
            <Copy aria-hidden size={12} strokeWidth={2} />
          )}
        </button>
      </Tooltip>
    </span>
  );
}
