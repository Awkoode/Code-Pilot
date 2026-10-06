import { query, queryOne } from "../db/pool";
import { AppError } from "../utils/AppError";
import type { CreateProjectInput } from "../validators/project.validator";

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  github_url: string;
  description: string | null;
  created_at: Date;
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<ProjectRow> {
  // Evitar que o utilizador cadastre o mesmo repositório duas vezes
  const existing = await queryOne<ProjectRow>(
    "select id from projects where user_id = $1 and github_url = $2",
    [userId, input.github_url]
  );

  if (existing) {
    throw new AppError("Repositório já cadastrado na sua conta", 409, "PROJECT_ALREADY_EXISTS");
  }

  const [project] = await query<ProjectRow>(
    `insert into projects (user_id, name, github_url, description)
     values ($1, $2, $3, $4)
     returning id, user_id, name, github_url, description, created_at`,
    [userId, input.name, input.github_url, input.description ?? null]
  );

  return project;
}

export async function getUserProjects(userId: string): Promise<ProjectRow[]> {
  return query<ProjectRow>(
    "select id, user_id, name, github_url, description, created_at from projects where user_id = $1 order by created_at desc",
    [userId]
  );
}

export async function getProjectById(userId: string, projectId: string): Promise<ProjectRow> {
  const project = await queryOne<ProjectRow>(
    "select id, user_id, name, github_url, description, created_at from projects where id = $1 and user_id = $2",
    [projectId, userId]
  );

  if (!project) {
    throw new AppError("Projeto não encontrado", 404, "PROJECT_NOT_FOUND");
  }

  return project;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const project = await queryOne<ProjectRow>(
    "select id from projects where id = $1 and user_id = $2",
    [projectId, userId]
  );

  if (!project) {
    throw new AppError("Projeto não encontrado", 404, "PROJECT_NOT_FOUND");
  }

  await query("delete from projects where id = $1", [projectId]);
}