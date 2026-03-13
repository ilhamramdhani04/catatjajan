import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { headers } from "next/headers";

function getPeriodRange(period: string | null): { from: Date; to: Date } {
  const now = new Date();
  if (period === "weekly") {
    const dayOfWeek = now.getDay();
    const from = new Date(now);
    from.setDate(now.getDate() - dayOfWeek);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  // Default: monthly
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to: now };
}

// ── GET /api/transactions?period=monthly|weekly ───────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as typeof session.user & {
    familyId?: string;
  };

  if (!user.familyId) {
    return NextResponse.json(
      { error: "Belum bergabung ke keluarga." },
      { status: 400 }
    );
  }

  const period = req.nextUrl.searchParams.get("period");
  const { from, to } = getPeriodRange(period);

  const data = await db.query.transactions.findMany({
    where: and(
      eq(transactions.familyId, user.familyId),
      gte(transactions.createdAt, from),
      lte(transactions.createdAt, to)
    ),
    with: {
      user: { columns: { name: true } },
      category: { columns: { name: true, icon: true } },
    },
    orderBy: [desc(transactions.createdAt)],
  });

  return NextResponse.json(data);
}

// ── POST /api/transactions ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
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

  let body: { categoryId: string; amount: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const { categoryId, amount, note } = body;

  if (!categoryId || typeof categoryId !== "string") {
    return NextResponse.json({ error: "categoryId wajib diisi." }, { status: 422 });
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount harus berupa angka positif." },
      { status: 422 }
    );
  }

  const [inserted] = await db
    .insert(transactions)
    .values({
      familyId: user.familyId,
      userId: user.id,
      categoryId,
      amount: Math.round(amount),
      note,
      source: "web",
    })
    .returning();

  return NextResponse.json(inserted, { status: 201 });
}
