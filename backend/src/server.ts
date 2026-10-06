import app from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";

async function bootstrap() {
  try {
    await pool.query("select 1");
    console.log("[db] Conectado ao PostgreSQL");
  } catch (err) {
    console.error("[db] Falha ao conectar:", (err as Error).message);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`[CodePilot] Backend rodando em http://localhost:${env.PORT}`);
    console.log(`[CodePilot] Health: http://localhost:${env.PORT}/api/health`);
  });
}

bootstrap();

import scannerRoutes from "./routes/scanner.routes";

// ...
app.use("/api", scannerRoutes);

import projectRoutes from "./routes/project.routes";

// ...
app.use("/api", projectRoutes);