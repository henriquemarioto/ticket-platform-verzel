import { z } from "zod";

export const validateTicketSchema = z
  .object({
    eventId: z.string().min(1, "ID do evento é obrigatório"),
    qrPayload: z.string().min(1).optional(),
    ticketCode: z.string().min(1).optional(),
  })
  .refine((data) => data.qrPayload || data.ticketCode, {
    message: "Informe o payload do QR Code ou o código do ingresso",
  });

export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;
