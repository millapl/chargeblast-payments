"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

export function Banner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section
      aria-label="Announcement"
      className="mt-6 flex h-[35px] items-center gap-2 rounded-md bg-subtle pr-[9px] pl-2 text-body"
    >
      <span className="mr-[5px] flex items-center gap-[5px]">
        <Sparkles aria-hidden size={12} className="text-ink" />
        <strong className="text-xs font-semibold text-ink-strong">New</strong>
      </span>
      <p className="flex-1 truncate text-[13.4px] text-ink">
        Rule Attributes are now in Sigma and Data Pipeline for better fraud
        insights.
      </p>
      <a
        href="#"
        className="text-[13.4px] font-medium text-accent-text hover:underline"
      >
        Get started
      </a>
      <span aria-hidden className="mx-[3px] h-4 w-px bg-border" />
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        className="flex size-5 items-center justify-center rounded-sm text-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        <X aria-hidden size={16} />
      </button>
    </section>
  );
}
