import { z } from "zod";

export const createSectorSchema = z.object({
  name: z.string().min(2, "Nome do setor é obrigatório"),
  type: z.enum(["GENERAL_ADMISSION", "NUMBERED_SEATS"]),
  price: z.coerce.number().positive("O valor deve ser maior que zero"),
  totalCapacity: z.coerce.number().int().optional(),
  rows: z.array(z.string()).optional().transform(arr => arr ? arr.map(r => r.trim().toUpperCase()) : arr),
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
  description: z.string().min(300, "A descrição do evento deve conter no mínimo 300 caracteres"),
  category: z.enum(["SHOW", "MOVIE", "THEATER", "FESTIVAL"]),
  bannerUrl: z.string().url("URL de imagem válida é obrigatória").or(z.literal("")),
  locationName: z.string().min(2, "Nome do local é obrigatório"),
  street: z.string().min(2, "Rua/Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(4, "Cidade e UF são obrigatórios").regex(/^.+,\s*[A-Z]{2}$/, "Campo obrigatório"),
  eventDate: z.string().datetime("Data e hora válidas são obrigatórias"),
  endDate: z.string().datetime("Data e hora de término válidas").optional().nullable().or(z.literal("")),
  entryStartTime: z.string().datetime("Data e hora de abertura dos portões válidas são obrigatórias"),
  isAdult: z.boolean().optional().default(false),
  sectors: z.array(createSectorSchema).min(1, "Adicione ao menos um setor"),
}).refine((data) => {
  const diffMs = new Date(data.eventDate).getTime() - new Date(data.entryStartTime).getTime();
  return diffMs >= 30 * 60 * 1000;
}, {
  message: "A abertura dos portões deve ser no mínimo 30 minutos antes do início do evento",
  path: ["entryStartTime"],
}).refine((data) => {
  const diffMs = new Date(data.eventDate).getTime() - new Date(data.entryStartTime).getTime();
  return diffMs <= 6 * 60 * 60 * 1000;
}, {
  message: "A abertura dos portões não pode ser anterior a 6 horas antes do início do evento",
  path: ["entryStartTime"],
}).refine((data) => {
  if (data.endDate && data.endDate.trim() !== "") {
    return new Date(data.endDate).getTime() > new Date(data.eventDate).getTime();
  }
  return true;
}, {
  message: "A data e hora de término deve ser posterior à data de início",
  path: ["endDate"],
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateSectorInput = z.infer<typeof createSectorSchema>;

export const updateEventStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "FINISHED", "CANCELLED"]),
});

export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>;

export const updateEventSchema = z.object({
  title: z.string().min(3, "Título do evento é obrigatório"),
  description: z.string().min(300, "A descrição do evento deve conter no mínimo 300 caracteres"),
  category: z.enum(["SHOW", "MOVIE", "THEATER", "FESTIVAL"]),
  bannerUrl: z.string().url("URL de imagem válida é obrigatória").or(z.literal("")),
  locationName: z.string().min(2, "Nome do local é obrigatório"),
  street: z.string().min(2, "Rua/Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(4, "Cidade e UF são obrigatórios").regex(/^.+,\s*[A-Z]{2}$/, "Campo obrigatório"),
  eventDate: z.string().datetime("Data e hora válidas são obrigatórias"),
  endDate: z.string().datetime("Data e hora de término válidas").optional().nullable().or(z.literal("")),
  entryStartTime: z.string().datetime("Data e hora de abertura dos portões válidas são obrigatórias"),
  isAdult: z.boolean().optional().default(false),
}).refine((data) => {
  const diffMs = new Date(data.eventDate).getTime() - new Date(data.entryStartTime).getTime();
  return diffMs >= 30 * 60 * 1000;
}, {
  message: "A abertura dos portões deve ser no mínimo 30 minutos antes do início do evento",
  path: ["entryStartTime"],
}).refine((data) => {
  const diffMs = new Date(data.eventDate).getTime() - new Date(data.entryStartTime).getTime();
  return diffMs <= 6 * 60 * 60 * 1000;
}, {
  message: "A abertura dos portões não pode ser anterior a 6 horas antes do início do evento",
  path: ["entryStartTime"],
}).refine((data) => {
  if (data.endDate && data.endDate.trim() !== "") {
    return new Date(data.endDate).getTime() > new Date(data.eventDate).getTime();
  }
  return true;
}, {
  message: "A data e hora de término deve ser posterior à data de início",
  path: ["endDate"],
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

