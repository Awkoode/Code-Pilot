import { Request, Response } from "express";

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: "ok",
    service: "codepilot-backend",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}