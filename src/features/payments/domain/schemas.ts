import { z } from "zod";
import {
  CARD_BRANDS,
  CURRENCIES,
  PAYMENT_ID_PATTERN,
  PAYMENT_STATUSES,
  WALLETS,
  type Payment,
} from "./types";

const last4 = z.string().regex(/^\d{4}$/);

const methodSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("card"), brand: z.enum(CARD_BRANDS), last4 }),
  z.object({
    type: z.literal("wallet"),
    wallet: z.enum(WALLETS),
    brand: z.enum(CARD_BRANDS),
    last4,
  }),
  z.object({ type: z.literal("ach"), bankName: z.string().min(1), last4 }),
]);

export const paymentSchema = z
  .object({
    id: z.string().regex(PAYMENT_ID_PATTERN),
    amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    currency: z.enum(CURRENCIES),
    status: z.enum(PAYMENT_STATUSES),
    customerName: z.string().min(1),
    customerEmail: z.email(),
    description: z.string().min(1),
    method: methodSchema,
    createdAt: z.iso.datetime(),
    refundedAt: z.iso.datetime().nullable(),
    declineReason: z.string().min(1).nullable(),
  })
  .superRefine((payment, ctx) => {
    if ((payment.status === "refunded") !== (payment.refundedAt !== null)) {
      ctx.addIssue({
        code: "custom",
        path: ["refundedAt"],
        message: "refundedAt must be set if and only if status is refunded",
      });
    }
    const declined =
      payment.status === "failed" || payment.status === "blocked";
    if (declined !== (payment.declineReason !== null)) {
      ctx.addIssue({
        code: "custom",
        path: ["declineReason"],
        message:
          "declineReason must be set if and only if status is failed or blocked",
      });
    }
  }) satisfies z.ZodType<Payment, unknown>;
