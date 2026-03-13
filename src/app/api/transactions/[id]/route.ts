import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── DELETE /api/transactions/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & { familyId?: string };
  const { id } = await params;

  // Pastikan transaksi milik keluarga yang sama (bukan keluarga lain)
  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.familyId, user.familyId ?? "")
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan." },
      { status: 404 }
    );
  }

  await db.delete(transactions).where(eq(transactions.id, id));

  return NextResponse.json({ ok: true });
}

// ── PATCH /api/transactions/[id] ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & { familyId?: string };
  const { id } = await params;

  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.familyId, user.familyId ?? "")
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan." },
      { status: 404 }
    );
  }

  let body: Partial<{ categoryId: string; amount: number; note: string }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (body.amount !== undefined && (typeof body.amount !== "number" || body.amount <= 0)) {
    return NextResponse.json(
      { error: "amount harus berupa angka positif." },
      { status: 422 }
    );
  }

  const [updated] = await db
    .update(transactions)
    .set({
      ...(body.categoryId && { categoryId: body.categoryId }),
      ...(body.amount && { amount: Math.round(body.amount) }),
      ...(body.note !== undefined && { note: body.note }),
    })
    .where(eq(transactions.id, id))
    .returning();

  return NextResponse.json(updated);
}
