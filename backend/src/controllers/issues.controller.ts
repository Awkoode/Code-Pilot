import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { queryOne } from "../db/pool";
import { AppError } from "../utils/AppError";

const VALID_SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);

/** GET /projects/:id/analyses/:analysisId/issues */
export async function listIssues(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    const severity = req.query.severity?.toString();
    if (severity && !VALID_SEVERITIES.has(severity)) {
      throw new AppError(`Severidade inválida: ${severity}`, 400, "INVALID_SEVERITY");
    }

    const result = await projectService.getFindings(analysisId, {
      severity,
      category: req.query.category?.toString(),
      file: req.query.file?.toString(),
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /projects/:id/analyses/:analysisId/issues/summary */
export async function issuesSummary(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    res.json(await projectService.getFindingsSummary(analysisId));
  } catch (err) {
    next(err);
  }
}

/** GET /projects/:id/analyses/:analysisId/critical-files */
export async function criticalFiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    const result = await queryOne<{ critical_files: unknown }>(
      "select critical_files from analyses where id = $1",
      [analysisId]
    );

    res.json({ criticalFiles: result?.critical_files ?? [] });
  } catch (err) {
    next(err);
  }
}