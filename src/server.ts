import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase, pool } from "./config/database.js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);

async function startServer(): Promise<void> {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Start HTTP server only after DB connection succeeds
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // 3. Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down server...");

      server.close(async () => {
        await pool.end();
        console.log("Database pool closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("Application startup failed:", error);
    await pool.end();
    process.exit(1);
  }
}

startServer();