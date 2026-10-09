import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { runHaskellAnalysis } from "../services/analyzer.service";
import { scanRepository } from "../services/scanner.service";
import { generateAIRefactoringReport } from "../services/ai.service";
import { getModel } from "../services/modelCatalog";
import { inspectFiles, summarize } from "../services/codeInspector.service";
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

    // Modelo validado primeiro: é uma checagem em memória, contra o catálogo.
    // Fazer antes do getProjectById evita uma query ao banco quando o
    // cliente mandou um id de modelo inválido.
    const requestedModel =
      typeof req.body?.model === "string" ? req.body.model : undefined;
    const model = getModel(requestedModel);

    const project = await projectService.getProjectById(req.user.sub, req.params.id);
    const repoUrl = project.github_url;

    if (!repoUrl) {
      throw new AppError("URL do GitHub não encontrada no projeto", 400, "BAD_REQUEST");
    }

    // 1. Baixa e escaneia o repositório
    const scanResult = await scanRepository(repoUrl);

    // 2. Processa as métricas no motor Haskell
    const analysisResults = await runHaskellAnalysis(scanResult.relevantFiles);

    // 3. Avaliação pelo modelo escolhido
    const aiReport = await generateAIRefactoringReport(
      scanResult.relevantFiles,
      analysisResults,
      model.id
    );

    // 4. Persiste a análise completa no PostgreSQL 💾
    const savedAnalysis = await projectService.saveAnalysisResult(
      project.id,
      analysisResults,
      aiReport
    );

    // 5. Motor determinístico linha a linha + arquivos mais críticos
    const findings = inspectFiles(scanResult.relevantFiles);
    const inspector = summarize(findings);

    const inserted = await projectService.saveFindings(savedAnalysis.id, findings);
    await projectService.updateCriticalFiles(savedAnalysis.id, inspector.criticalFiles);

    // Só os arquivos com achado entram no banco de conteúdo: é o que a
    // página de código da Fase 3 precisa, e guardar o repositório inteiro
    // seria desperdício.
    const pathsWithFindings = new Set(findings.map((f) => f.file));
    const stored = await projectService.storeAnalyzedFiles(
      savedAnalysis.id,
      scanResult.relevantFiles,
      pathsWithFindings
    );

    console.log("[analyze] concluído:", {
      projeto: project.id,
      analise: savedAnalysis.id,
      modelo: model.id,
      achados: inserted,
      arquivosComAchados: inspector.filesWithFindings,
      arquivosArmazenados: stored.stored,
      arquivosOmitidos: stored.truncated,
    });

    res.status(200).json({
      message: "Análise determinística e de IA concluída e salva com sucesso",
      analysisId: savedAnalysis.id,
      metrics: analysisResults,
      aiReport,
      findings: {
        total: inspector.totalFindings,
        bySeverity: inspector.bySeverity,
        byCategory: inspector.byCategory,
        filesAffected: inspector.filesWithFindings,
        criticalFiles: inspector.criticalFiles,
        topRules: inspector.topRules,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyses(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    const analyses = await projectService.getProjectAnalyses(
      req.user.sub,
      req.params.id
    );

    res.status(200).json({ analyses });
  } catch (err) {
    next(err);
  }
}