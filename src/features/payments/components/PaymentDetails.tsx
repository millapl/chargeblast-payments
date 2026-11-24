import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";
import { getPaymentById } from "../data/repository";
import { formatDateTime } from "../domain/dates";
import { BRAND_LABELS, METHOD_LABELS, WALLET_LABELS } from "../domain/labels";
import { formatMoney } from "../domain/money";
import { buildTimeline } from "../domain/timeline";
import { PAYMENT_ID_PATTERN, type PaymentMethod } from "../domain/types";
import { StatusBadge } from "./StatusBadge";

function describeMethod(method: PaymentMethod): string {
  switch (method.type) {
    case "card":
      return `${BRAND_LABELS[method.brand]} •••• ${method.last4}`;
    case "wallet":
      return `${WALLET_LABELS[method.wallet]} (${BRAND_LABELS[method.brand]} •••• ${method.last4})`;
    case "ach":
      return `${method.bankName} •••• ${method.last4}`;
  }
}

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-line py-2 max-sm:grid-cols-1 max-sm:gap-0">
      <dt className="text-muted">{label}</dt>
      <dd
        className={mono ? "font-mono text-xs break-all text-ink" : "text-ink"}
      >
        {children}
      </dd>
    </div>
  );
}

export async function PaymentDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!PAYMENT_ID_PATTERN.test(id)) notFound();
  await connection();
  const now = new Date();
  const payment = getPaymentById(id, now);
  if (!payment) notFound();

  const at = (iso: string) => formatDateTime(iso, now.getTime());
  const timeline = buildTimeline(payment);

  return (
    <article>
      <nav aria-label="Breadcrumb" className="mt-5">
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 rounded-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <ChevronLeft aria-hidden size={14} />
          Transactions
        </Link>
      </nav>

      <header className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-title font-bold text-ink-strong">
          {formatMoney(payment.amountMinor, payment.currency)}{" "}
          <span className="font-semibold text-muted">{payment.currency}</span>
        </h1>
        <StatusBadge status={payment.status} />
      </header>
      <p className="mt-1 font-mono text-xs text-muted">{payment.id}</p>

      <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <section aria-labelledby="timeline-heading">
          <h2
            id="timeline-heading"
            className="mb-3 text-[15px] font-semibold text-ink-strong"
          >
            Timeline
          </h2>
          <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
            {timeline.map((event) => (
              <li key={event.id} className="relative">
                <span
                  aria-hidden
                  className="absolute top-[7px] -left-[25px] size-2 rounded-full border border-control bg-white"
                />
                <p className="font-semibold text-ink-strong">{event.title}</p>
                {event.description && (
                  <p className="text-muted">{event.description}</p>
                )}
                <time dateTime={event.at} className="text-xs text-muted">
                  {at(event.at)}
                </time>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">
            Synthetic demo data: events are derived from the payment&apos;s
            status and timestamps.
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="details-heading">
            <h2
              id="details-heading"
              className="mb-1 text-[15px] font-semibold text-ink-strong"
            >
              Payment details
            </h2>
            <dl className="border-t border-line">
              <Field label="Amount">
                {formatMoney(payment.amountMinor, payment.currency)}{" "}
                {payment.currency}
              </Field>
              <Field label="Status">
                <StatusBadge status={payment.status} />
              </Field>
              <Field label="Payment method">
                {METHOD_LABELS[payment.method.type]} ·{" "}
                {describeMethod(payment.method)}
              </Field>
              <Field label="Description">{payment.description}</Field>
              <Field label="Customer">
                {payment.customerName} · {payment.customerEmail}
              </Field>
              <Field label="Created">{at(payment.createdAt)}</Field>
              {payment.refundedAt && (
                <Field label="Refunded">{at(payment.refundedAt)}</Field>
              )}
              {payment.declineReason && (
                <Field label="Decline reason">{payment.declineReason}</Field>
              )}
            </dl>
          </section>

          <section aria-labelledby="metadata-heading">
            <h2
              id="metadata-heading"
              className="mb-1 text-[15px] font-semibold text-ink-strong"
            >
              Metadata
            </h2>
            <dl className="border-t border-line">
              <Field label="payment_id" mono>
                {payment.id}
              </Field>
              <Field label="customer_email" mono>
                {payment.customerEmail}
              </Field>
              <Field label="currency_minor_amount" mono>
                {String(payment.amountMinor)}
              </Field>
              <Field label="payment_method_type" mono>
                {payment.method.type}
              </Field>
            </dl>
          </section>
        </div>
      </div>
    </article>
  );
}
