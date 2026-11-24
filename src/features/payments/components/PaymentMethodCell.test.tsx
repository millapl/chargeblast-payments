import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentMethodCell } from "./PaymentMethodCell";

describe("PaymentMethodCell", () => {
  it("shows the masked last four digits and an accessible description for cards", () => {
    render(
      <PaymentMethodCell
        method={{ type: "card", brand: "visa", last4: "4242" }}
      />,
    );
    expect(screen.getByText("4242")).toBeInTheDocument();
    expect(
      screen.getByText("4242").querySelectorAll("span.rounded-full"),
    ).toHaveLength(4);
    expect(screen.getByText("Visa card ending in 4242")).toHaveClass("sr-only");
  });

  it("names the wallet and the underlying card", () => {
    render(
      <PaymentMethodCell
        method={{
          type: "wallet",
          wallet: "apple_pay",
          brand: "mastercard",
          last4: "0007",
        }}
      />,
    );
    expect(
      screen.getByText("Apple Pay, Mastercard card ending in 0007"),
    ).toBeInTheDocument();
  });

  it("describes ACH accounts without inventing a card brand", () => {
    render(
      <PaymentMethodCell
        method={{ type: "ach", bankName: "Northwind Bank", last4: "1234" }}
      />,
    );
    expect(
      screen.getByText("ACH bank account at Northwind Bank ending in 1234"),
    ).toBeInTheDocument();
  });
});
