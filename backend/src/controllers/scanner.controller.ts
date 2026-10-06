import { Request, Response, NextFunction } from "express";
import * as scannerService from "../services/scanner.service";
import * as projectService from "../services/project.service";
import { AppError } from "../utils/AppError";

export async function scanProject(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const { projectId } = req.params;
    const project = await projectService.getProjectById(req.user.sub, projectId);

    const scanResult = await scannerService.scanRepository(project.github_url);

    res.json({
      message: "Repositório mapeado com sucesso",
      summary: {
        owner: scanResult.owner,
        repo: scanResult.repo,
        totalFilesCount: scanResult.totalFilesCount,
        totalLinesCount: scanResult.totalLinesCount,
        totalSizeBytes: scanResult.totalSizeBytes,
        scannedFilesCount: scanResult.relevantFiles.length,
      },
      files: scanResult.relevantFiles.map((f) => ({
        path: f.relativePath,
        lines: f.linesCount,
        size: f.sizeBytes,
      })),
    });
  } catch (err) {
    next(err);
  }
}