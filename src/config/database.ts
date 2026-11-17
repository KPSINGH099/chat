import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5439),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Check database connection
export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();

    console.log("PostgreSQL connected successfully");

    client.release();
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    throw error;
  }
}