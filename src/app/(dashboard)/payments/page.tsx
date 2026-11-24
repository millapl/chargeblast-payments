import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsContent } from "@/features/payments/components/PaymentsContent";
import { PaymentsTableSkeleton } from "@/features/payments/components/PaymentsTableSkeleton";
import { Banner } from "@/layout/Banner";
import { PageHeader } from "@/layout/PageHeader";
import { Tabs } from "@/layout/Tabs";

export const metadata: Metadata = { title: "Payments" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader title="Transactions" />
      <Tabs />
      <Banner />
      <div className="mt-[15px]">
        <Suspense fallback={<PaymentsTableSkeleton />}>
          <PaymentsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
