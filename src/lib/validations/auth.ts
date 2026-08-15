import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Insira um endereço de e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Insira um endereço de e-mail válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas informadas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
