import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { runHaskellAnalysis } from "../services/analyzer.service";
import { downloadAndScanRepo } from "../services/scanner.service"; // ajuste para o nome do seu serviço de scan
import { createProjectSchema } from "../validators/project.validator";
import { AppError } from "../utils/AppError";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message ?? "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const project = await projectService.createProject(req.user.sub, parsed.data);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const projects = await projectService.getUserProjects(req.user.sub);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const project = await projectService.getProjectById(req.user.sub, req.params.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    await projectService.deleteProject(req.user.sub, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function analyze(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const project = await projectService.getProjectById(req.user.sub, req.params.id);

    // 1. Baixa e filtra os arquivos do repositório
    const scannedFiles = await downloadAndScanRepo(project.githubUrl);

    // 2. Envia os arquivos para o serviço Haskell na porta 8001
    const analysisResults = await runHaskellAnalysis(scannedFiles);

    res.status(200).json({
      message: "Análise determinística concluída com sucesso",
      metrics: analysisResults,
    });
  } catch (err) {
    next(err);
  }
}