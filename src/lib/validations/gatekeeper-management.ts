import { z } from "zod";

export const createTemporaryGatekeeperSchema = z.object({
  name: z.string().min(2, "Nome ou identificação da portaria é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
  autoGenerate: z.boolean().default(true),
});

export type CreateTemporaryGatekeeperInput = z.infer<typeof createTemporaryGatekeeperSchema>;
