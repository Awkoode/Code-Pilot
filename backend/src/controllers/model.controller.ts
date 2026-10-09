import { Request, Response, NextFunction } from "express";
import { listModels, DEFAULT_MODEL_ID } from "../services/modelCatalog";

export function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      defaultModel: DEFAULT_MODEL_ID,
      models: listModels(),
    });
  } catch (err) {
    next(err);
  }
}
