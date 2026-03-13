import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, {
    // Wajib untuk Supabase transaction mode pooler (port 6543)
    prepare: false,
    // Batasi koneksi di lingkungan serverless
    max: 1,
  });

  return drizzle(client, { schema });
}

type DrizzleDB = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var __db: DrizzleDB | undefined;
}

export const db: DrizzleDB = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
