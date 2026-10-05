import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .max(254, "Email muito longo")
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa"), // 72 = limite do bcrypt
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Senha obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;