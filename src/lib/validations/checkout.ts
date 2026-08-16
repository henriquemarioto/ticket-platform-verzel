import { z } from "zod";

export const checkoutSchema = z.object({
  reservationId: z.string().min(1, "ID de reserva temporária obrigatório"),
  paymentMethod: z.enum(["SIMULATED_CREDIT_CARD", "SIMULATED_PIX"]).default("SIMULATED_CREDIT_CARD"),
  action: z.enum(["APPROVE", "REJECT"]).default("APPROVE"),
  reason: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
