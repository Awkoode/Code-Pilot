import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AppError } from "../utils/AppError";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const result = await authService.registerUser(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const result = await authService.loginUser(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const user = await authService.getUserById(req.user.sub);
    if (!user) {
      throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}