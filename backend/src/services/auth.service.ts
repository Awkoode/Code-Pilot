import bcrypt from "bcrypt";
import { query, queryOne } from "../db/pool";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";

const BCRYPT_ROUNDS = 12;

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  created_at: Date;
}

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await queryOne<{ id: string }>(
    "select id from users where email = $1",
    [input.email]
  );

  if (existing) {
    throw new AppError("Email já cadastrado", 409, "EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [user] = await query<UserRow>(
    `insert into users (email, password_hash)
     values ($1, $2)
     returning id, email, password_hash, created_at, updated_at`,
    [input.email, passwordHash]
  );

  const token = signToken({ sub: user.id, email: user.email });

  return { user: toPublicUser(user), token };
}

export async function loginUser(input: LoginInput) {
  const user = await queryOne<UserRow>(
    "select * from users where email = $1",
    [input.email]
  );

  // Mensagem genérica de propósito (evita user enumeration)
  if (!user) {
    throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
  }

  const token = signToken({ sub: user.id, email: user.email });

  return { user: toPublicUser(user), token };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await queryOne<UserRow>(
    "select id, email, password_hash, created_at, updated_at from users where id = $1",
    [id]
  );
  return user ? toPublicUser(user) : null;
}