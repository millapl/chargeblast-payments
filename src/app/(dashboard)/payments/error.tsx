"use client";

import { Button } from "@/shared/ui/Button";

export default function PaymentsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-16 flex flex-col items-center gap-3 text-center"
    >
      <h2 className="text-[16px] font-semibold text-ink-strong">
        Something went wrong
      </h2>
      <p className="max-w-[360px] text-muted">
        The payments could not be loaded. Try again; if the problem continues,
        reload the page.
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
