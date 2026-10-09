import { Router } from "express";
import * as modelController from "../controllers/model.controller";

const router = Router();

// Catálogo de modelos é público: o seletor aparece antes do login
// (a landing tem CTA de análise) e a lista não contém nada sensível.
router.get("/models", modelController.list);

export default router;
