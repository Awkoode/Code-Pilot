import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import * as issuesController from "../controllers/issues.controller";
import * as codeController from "../controllers/code.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Middleware global de autenticação para todas as rotas de projetos
router.use(requireAuth);

// Rotas CRUD de Projetos
router.post("/", projectController.create);
router.get("/", projectController.list);
router.get("/:id", projectController.getOne);
router.delete("/:id", projectController.remove);

// 🚀 Rota de Análise Determinística (Haskell Service)
router.post("/:id/analyze", projectController.analyze);

// Obter histórico de análises de um projeto
router.get("/:id/analyses", projectController.getAnalyses);

// Achados por linha (Fase 2)
router.get("/:id/analyses/:analysisId/issues", issuesController.listIssues);
router.get("/:id/analyses/:analysisId/issues/summary", issuesController.issuesSummary);
router.get("/:id/analyses/:analysisId/critical-files", issuesController.criticalFiles);

// Visualização de código (Fase 3)
router.get("/:id/analyses/:analysisId/files", codeController.listFiles);
router.get("/:id/analyses/:analysisId/file", codeController.getFile);
router.post("/:id/analyses/:analysisId/explain", codeController.explain);

export default router;