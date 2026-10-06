import { Router } from "express";
import * as scannerController from "../controllers/scanner.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/projects/:projectId/scan", scannerController.scanProject);

export default router;