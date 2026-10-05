import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  console.error("[unhandled]", err);

  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(env.NODE_ENV === "development" ? { detail: err.message } : {}),
  });
}