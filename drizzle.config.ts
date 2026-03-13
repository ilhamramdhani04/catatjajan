import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Untuk migrasi: gunakan DIRECT_URL (koneksi langsung, bukan pooler)
    // Untuk runtime: DATABASE_URL bisa pakai pooler (port 6543)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
