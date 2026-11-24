import type { Payment, PaymentStatus } from "./types";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  /** ISO 8601 UTC. */
  at: string;
}

const SECOND_MS = 1000;
/** Gap used between the synthetic steps of a payment; the dataset stores no event log. */
const STEP_MS = 2 * SECOND_MS;

function shift(iso: string, steps: number): string {
  return new Date(Date.parse(iso) + steps * STEP_MS).toISOString();
}

const OUTCOME_TITLES: Record<
  Exclude<PaymentStatus, "refunded" | "failed" | "blocked">,
  string
> = {
  succeeded: "Payment succeeded",
  pending: "Payment is pending",
  canceled: "Payment was canceled",
  disputed: "Payment succeeded",
  uncaptured: "Payment authorized, awaiting capture",
};

/**
 * Derives an ordered event list from a payment. The dataset has no event log, so these events
 * are synthetic and reconstructed from `status`, `createdAt`, `refundedAt` and `declineReason`.
 */
export function buildTimeline(payment: Payment): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: "created", title: "Payment created", at: payment.createdAt },
  ];

  switch (payment.status) {
    case "failed":
      events.push({
        id: "failed",
        title: "Payment failed",
        description: payment.declineReason ?? undefined,
        at: shift(payment.createdAt, 1),
      });
      break;
    case "blocked":
      events.push({
        id: "blocked",
        title: "Payment blocked",
        description: payment.declineReason ?? undefined,
        at: shift(payment.createdAt, 1),
      });
      break;
    case "refunded":
      events.push({
        id: "succeeded",
        title: "Payment succeeded",
        at: shift(payment.createdAt, 1),
      });
      if (payment.refundedAt) {
        events.push({
          id: "refunded",
          title: "Payment refunded",
          at: payment.refundedAt,
        });
      }
      break;
    case "disputed":
      events.push({
        id: "succeeded",
        title: OUTCOME_TITLES.disputed,
        at: shift(payment.createdAt, 1),
      });
      events.push({
        id: "disputed",
        title: "Dispute opened",
        at: shift(payment.createdAt, 3),
      });
      break;
    default:
      events.push({
        id: payment.status,
        title: OUTCOME_TITLES[payment.status],
        at: shift(payment.createdAt, 1),
      });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
