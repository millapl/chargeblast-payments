import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentDetails } from "@/features/payments/components/PaymentDetails";

export const metadata: Metadata = { title: "Payment details" };

export default function PaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" className="mt-16 text-muted" role="status">
          Loading payment…
        </div>
      }
    >
      <PaymentDetails params={params} />
    </Suspense>
  );
}
