import { Router } from "express";
import * as projectController from "../controllers/project.controller";
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

export default router;