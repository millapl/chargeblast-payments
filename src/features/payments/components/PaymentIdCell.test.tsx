import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/ui/Tooltip";
import { PaymentIdCell } from "./PaymentIdCell";
import { PaymentsTableContext } from "./table-context";

const ID = "pi_AbCdEfGhIjKlMnOpQrStUvWx";

function setup() {
  const announce = vi.fn();
  const user = userEvent.setup();
  render(
    <PaymentsTableContext
      value={{ now: Date.parse("2026-11-24T12:00:00Z"), announce }}
    >
      <TooltipProvider>
        <PaymentIdCell id={ID} />
      </TooltipProvider>
    </PaymentsTableContext>,
  );
  return { announce, user };
}

describe("PaymentIdCell", () => {
  it("shows a shortened id but exposes the full id to assistive technology", () => {
    setup();
    expect(screen.getByText("pi_AbCd…UvWx")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText(ID)).toHaveClass("sr-only");
  });

  it("copies the full id to the clipboard and announces it", async () => {
    const { announce, user } = setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    await user.click(
      screen.getByRole("button", { name: `Copy payment ID ${ID}` }),
    );
    expect(writeText).toHaveBeenCalledWith(ID);
    expect(announce).toHaveBeenCalledWith("Payment ID copied to clipboard");
  });

  it("is operable from the keyboard", async () => {
    const { announce, user } = setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    await user.tab(); // the id link
    await user.tab(); // the copy button
    await user.keyboard("{Enter}");
    expect(writeText).toHaveBeenCalledWith(ID);
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it("reports failure without throwing when the clipboard is unavailable", async () => {
    const { announce, user } = setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied"),
    );
    await user.click(
      screen.getByRole("button", { name: `Copy payment ID ${ID}` }),
    );
    expect(announce).toHaveBeenCalledWith("Could not copy payment ID");
  });
});
