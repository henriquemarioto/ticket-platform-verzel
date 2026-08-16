import { z } from "zod";

export const reserveGeneralAdmissionSchema = z.object({
  sectorId: z.string().min(1, "O ID do setor é obrigatório"),
  quantity: z.number().int().min(1).max(6, "Limite de 6 ingressos por compra"),
});

export const reserveSeatsSchema = z.object({
  eventId: z.string().min(1, "O ID do evento é obrigatório"),
  sectorId: z.string().min(1, "O ID do setor é obrigatório"),
  seatIds: z.array(z.string()).min(1).max(6, "Limite de 6 ingressos por compra"),
});
