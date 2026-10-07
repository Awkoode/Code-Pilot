import app from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";

async function bootstrap() {
  try {
    await pool.query("select 1");
    console.log("[db] Conectado ao PostgreSQL");
  } catch (err) {
    const dbError: {
      name?: unknown;
      message?: unknown;
      code?: unknown;
      syscall?: unknown;
      address?: unknown;
      port?: unknown;
    } =
      err && typeof err === "object"
        ? (err as {
            name?: unknown;
            message?: unknown;
            code?: unknown;
            syscall?: unknown;
            address?: unknown;
            port?: unknown;
          })
        : { message: String(err) };

    console.error("[db] Falha ao conectar:", {
      name: dbError.name,
      message: dbError.message,
      code: dbError.code,
      syscall: dbError.syscall,
      address: dbError.address,
      port: dbError.port,
    });
    process.exit(1);
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[CodePilot] Backend escutando em 0.0.0.0:${env.PORT}`);
    console.log(`[CodePilot] Health: /api/health`);
  });
}

bootstrap();
