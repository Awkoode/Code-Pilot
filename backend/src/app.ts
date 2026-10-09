import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes"; // <-- Importa as rotas de projeto
import scannerRoutes from "./routes/scanner.routes"; // <-- Importa as rotas do scanner
import modelRoutes from "./routes/model.routes"; // <-- Catálogo de modelos
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./config/env";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// Rotas da aplicação
app.use("/api", healthRoutes);
app.use("/api", modelRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", scannerRoutes); // <-- Registra /api/projects/:projectId/scan

// 404 (SEMPRE depois de todas as rotas válidas)
app.use((_req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});

// Handler global de erro (SEMPRE por último)
app.use(errorHandler);

export default app;