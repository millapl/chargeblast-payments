import { connection } from "next/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getPayments } from "../data/repository";
import { queryPayments } from "../domain/query";
import { parsePaymentsQuery } from "../domain/url-state";
import { PaymentsView } from "./PaymentsView";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function PaymentsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = parsePaymentsQuery(await searchParams);
  await connection();
  const now = new Date();
  const result = queryPayments(getPayments(now), query, now.getTime());

  return (
    <NuqsAdapter>
      <PaymentsView
        items={result.items}
        sort={query.sort}
        now={now.getTime()}
        pagination={{
          firstIndex: result.firstIndex,
          lastIndex: result.lastIndex,
          total: result.total,
          page: result.page,
          pageCount: result.pageCount,
          size: query.size,
        }}
      />
    </NuqsAdapter>
  );
}
