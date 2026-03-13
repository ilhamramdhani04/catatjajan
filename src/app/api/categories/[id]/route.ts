import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── PATCH /api/categories/[id] ────────────────────────────────────────────────
// Hanya admin yang boleh mengubah budget atau nama kategori custom.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa mengubah kategori." },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Pastikan kategori milik keluarga user ini
  const existing = await db.query.categories.findFirst({
    where: and(
      eq(categories.id, id),
      eq(categories.familyId, user.familyId)
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 }
    );
  }

  let body: Partial<{ name: string; icon: string; monthlyBudget: number | null }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  // Tidak boleh mengubah nama kategori default
  if (body.name && existing.isDefault) {
    return NextResponse.json(
      { error: "Nama kategori bawaan tidak bisa diubah." },
      { status: 422 }
    );
  }

  if (body.name !== undefined && body.name.trim() === "") {
    return NextResponse.json(
      { error: "Nama kategori tidak boleh kosong." },
      { status: 422 }
    );
  }

  if (
    body.monthlyBudget !== undefined &&
    body.monthlyBudget !== null &&
    (typeof body.monthlyBudget !== "number" || body.monthlyBudget < 0)
  ) {
    return NextResponse.json(
      { error: "monthlyBudget harus berupa angka positif atau null." },
      { status: 422 }
    );
  }

  const [updated] = await db
    .update(categories)
    .set({
      ...(body.name && { name: body.name.trim() }),
      ...(body.icon && { icon: body.icon }),
      ...(body.monthlyBudget !== undefined && { monthlyBudget: body.monthlyBudget }),
    })
    .where(eq(categories.id, id))
    .returning();

  return NextResponse.json(updated);
}

// ── DELETE /api/categories/[id] ───────────────────────────────────────────────
// Hanya bisa menghapus kategori custom (bukan bawaan).
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & {
    familyId?: string;
    role?: string;
  };

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menghapus kategori." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await db.query.categories.findFirst({
    where: and(
      eq(categories.id, id),
      eq(categories.familyId, user.familyId ?? "")
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 }
    );
  }

  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Kategori bawaan tidak bisa dihapus." },
      { status: 422 }
    );
  }

  await db.delete(categories).where(eq(categories.id, id));

  return NextResponse.json({ ok: true });
}
