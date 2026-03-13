import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// ── GET /api/categories ───────────────────────────────────────────────────────
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & { familyId?: string };

  if (!user.familyId) {
    return NextResponse.json(
      { error: "Belum bergabung ke keluarga." },
      { status: 400 }
    );
  }

  const data = await db.query.categories.findMany({
    where: eq(categories.familyId, user.familyId),
  });

  return NextResponse.json(data);
}

// ── POST /api/categories ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & {
    familyId?: string;
    role?: string;
  };

  if (!user.familyId) {
    return NextResponse.json(
      { error: "Belum bergabung ke keluarga." },
      { status: 400 }
    );
  }

  let body: { name: string; icon?: string; monthlyBudget?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json(
      { error: "Nama kategori wajib diisi." },
      { status: 422 }
    );
  }

  // Cek duplikat di keluarga yang sama
  const duplicate = await db.query.categories.findFirst({
    where: eq(categories.familyId, user.familyId),
  });

  // nama unik per keluarga -- cek manual karena LOWER() tidak ada di Drizzle sqlite
  const allCats = await db.query.categories.findMany({
    where: eq(categories.familyId, user.familyId),
  });

  const isDuplicate = allCats.some(
    (c) => c.name.toLowerCase() === body.name.trim().toLowerCase()
  );

  if (isDuplicate) {
    return NextResponse.json(
      { error: "Kategori dengan nama ini sudah ada." },
      { status: 409 }
    );
  }

  const [inserted] = await db
    .insert(categories)
    .values({
      familyId: user.familyId,
      name: body.name.trim(),
      icon: body.icon ?? "💰",
      isDefault: false,
      monthlyBudget: body.monthlyBudget ?? null,
    })
    .returning();

  // Suppress unused variable warning
  void duplicate;

  return NextResponse.json(inserted, { status: 201 });
}
