import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDb() {
  const client = createClient({
    // Format lokal : "file:./local.db"
    // Format Turso  : "libsql://<db-name>-<org>.turso.io"
    url: process.env.DATABASE_URL ?? "file:./local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN, // undefined saat dev lokal, aman
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
