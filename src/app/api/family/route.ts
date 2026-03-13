import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { families, users, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const DEFAULT_CATEGORIES = [
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

// ── POST /api/family ──────────────────────────────────────────────────────────
// Membuat grup keluarga baru dan menghubungkannya ke user yang sedang login.
// Setiap user hanya boleh memiliki satu keluarga.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = session.user as typeof session.user & {
    familyId?: string;
  };

  if (sessionUser.familyId) {
    return NextResponse.json(
      { error: "Kamu sudah bergabung ke sebuah keluarga." },
      { status: 409 }
    );
  }

  let body: { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json(
      { error: "Nama keluarga wajib diisi." },
      { status: 422 }
    );
  }

  // Buat keluarga baru + seed kategori default dalam satu transaksi
  const [family] = await db.insert(families).values({ name: body.name.trim() }).returning();

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      familyId: family.id,
      name: cat.name,
      icon: cat.icon,
      isDefault: true,
    }))
  );

  // Update user: set familyId dan role adminwa
  await db
    .update(users)
    .set({ familyId: family.id, role: "admin" })
    .where(eq(users.id, session.user.id));

  return NextResponse.json(family, { status: 201 });
}
