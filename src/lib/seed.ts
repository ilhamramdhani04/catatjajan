/**
 * Seed script: jalankan dengan `npm run db:seed`
 * Hanya untuk development/testing — jangan dijalankan di production.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Buat keluarga demo
  const [family] = await db
    .insert(schema.families)
    .values({ name: "Keluarga Demo" })
    .onConflictDoNothing()
    .returning();

  if (!family) {
    console.log("Keluarga demo sudah ada, skip seed.");
    return;
  }

  console.log(`Family created: ${family.id}`);

  // Seed kategori default
  const defaultCategories = [
    { name: "Makan", icon: "🍽️" },
    { name: "Jajan", icon: "🧋" },
    { name: "Belanja", icon: "🛒" },
    { name: "Transportasi", icon: "🚗" },
    { name: "Tagihan", icon: "📄" },
    { name: "Kesehatan", icon: "💊" },
    { name: "Pendidikan", icon: "📚" },
    { name: "Hiburan", icon: "🎬" },
    { name: "Lainnya", icon: "📦" },
  ];

  await db.insert(schema.categories).values(
    defaultCategories.map((c) => ({
      familyId: family.id,
      name: c.name,
      icon: c.icon,
      isDefault: true,
    }))
  );

  console.log(`Seeded ${defaultCategories.length} categories.`);
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
