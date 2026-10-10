import { Router } from "express";
import * as servicesController from "../controllers/services.controller";

const router = Router();

// Rotas públicas de diagnóstico: o objetivo é exatamente conseguir
// verificar a saúde dos serviços sem estar logado.
router.get("/services/analyzer/health", servicesController.pingAnalyzer);
router.get("/services/analyzer/probe", servicesController.probeAnalyzer);
router.get("/services/status", servicesController.overallStatus);

export default router;