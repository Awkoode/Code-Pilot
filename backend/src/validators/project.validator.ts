import { z } from "zod";

// Regex flexível para validar URLs públicas do GitHub
const githubUrlRegex = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\/)?$/;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  github_url: z
    .string()
    .url("URL inválida")
    .regex(githubUrlRegex, "Formato de URL do GitHub inválido (ex: https://github.com/owner/repo)")
    .transform((val) => val.replace(/\/$/, "")), // Remove barra final se houver
  description: z.string().max(500, "Descrição muito longa").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;