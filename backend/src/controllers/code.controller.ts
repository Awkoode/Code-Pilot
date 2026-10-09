import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { explainFindings, countPendingComments } from "../services/aiFindings.service";
import { getModel } from "../services/modelCatalog";
import { AppError } from "../utils/AppError";

/** GET /projects/:id/analyses/:analysisId/files */
export async function listFiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    const [files, pending] = await Promise.all([
      projectService.listAnalyzedFiles(analysisId),
      countPendingComments(analysisId),
    ]);

    res.json({ files, pendingComments: pending });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /projects/:id/analyses/:analysisId/file?path=...
 *
 * Devolve as linhas do arquivo já separadas, cada uma com a severidade do
 * achado mais grave que incide sobre ela. O front não precisa cruzar dados.
 */
export async function getFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    const path = req.query.path?.toString();

    if (!path) {
      throw new AppError("Informe o parâmetro ?path=", 400, "MISSING_PATH");
    }

    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    const file = await projectService.getAnalyzedFile(analysisId, path);
    if (!file) {
      throw new AppError("Arquivo não disponível para esta análise", 404, "FILE_NOT_FOUND");
    }

    const page = await projectService.getFindings(analysisId, { file: path, limit: 500 });

    // Índice linha -> achados daquela linha.
    const byLine = new Map<number, typeof page.issues>();
    for (const issue of page.issues) {
      const list = byLine.get(issue.line);
      if (list) list.push(issue);
      else byLine.set(issue.line, [issue]);
    }

    const lines = file.content.split("\n").map((text, i) => {
      const number = i + 1;
      const findings = byLine.get(number) ?? [];
      return {
        number,
        text,
        findings,
        severity: findings[0]?.severity ?? null,
      };
    });

    res.json({
      filePath: file.filePath,
      linesCount: file.linesCount,
      totalFindings: page.total,
      lines,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /projects/:id/analyses/:analysisId/explain */
export async function explain(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const { analysisId } = req.params;
    const model = getModel(
      typeof req.body?.model === "string" ? req.body.model : undefined
    );
    const max =
      typeof req.body?.max === "number" && req.body.max > 0 ? req.body.max : undefined;

    await projectService.assertAnalysisOwnership(req.user.sub, analysisId);

    const result = await explainFindings(analysisId, model.id, max);
    res.json(result);
  } catch (err) {
    next(err);
  }
}