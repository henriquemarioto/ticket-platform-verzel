import { z } from "zod";

export const createSectorSchema = z.object({
  name: z.string().min(2, "Nome do setor é obrigatório"),
  type: z.enum(["GENERAL_ADMISSION", "NUMBERED_SEATS"]),
  price: z.coerce.number().positive("O valor deve ser maior que zero"),
  totalCapacity: z.coerce.number().int().optional(),
  rows: z.array(z.string()).optional(),
  seatsPerRow: z.coerce.number().int().optional(),
}).refine(data => {
  if (data.type === "GENERAL_ADMISSION") {
    return data.totalCapacity !== undefined && data.totalCapacity > 0;
  }
  return true;
}, {
  message: "Capacidade é obrigatória para setores de pista",
  path: ["totalCapacity"]
}).refine(data => {
  if (data.type === "NUMBERED_SEATS") {
    return data.rows !== undefined && data.rows.length > 0 && data.seatsPerRow !== undefined && data.seatsPerRow > 0;
  }
  return true;
}, {
  message: "Fileiras e cadeiras por fileira são obrigatórias para assentos numerados",
  path: ["type"] // Generic path, can be handled in UI
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Título do evento é obrigatório"),
  description: z.string().min(10, "Descrição detalhada é obrigatória"),
  category: z.enum(["SHOW", "MOVIE", "THEATER", "FESTIVAL"]),
  bannerUrl: z.string().url("URL de imagem válida é obrigatória").or(z.literal("")),
  locationName: z.string().min(2, "Nome do local é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  eventDate: z.string().datetime("Data e hora válidas são obrigatórias"),
  sectors: z.array(createSectorSchema).min(1, "Adicione ao menos um setor"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateSectorInput = z.infer<typeof createSectorSchema>;
