import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STATUS_LABELS } from "../domain/labels";
import { PAYMENT_STATUSES } from "../domain/types";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it.each(PAYMENT_STATUSES)(
    "renders a text label for %s (never color alone)",
    (status) => {
      const { container } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("uses distinct tones for success and failure", () => {
    render(
      <>
        <StatusBadge status="succeeded" />
        <StatusBadge status="failed" />
      </>,
    );
    expect(screen.getByText("Succeeded")).toHaveClass("text-success-text");
    expect(screen.getByText("Failed")).toHaveClass("text-danger-text");
  });
});
