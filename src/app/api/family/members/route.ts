import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// ── GET /api/family/members ───────────────────────────────────────────────────
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

  const members = await db.query.users.findMany({
    where: eq(users.familyId, user.familyId),
    columns: { id: true, name: true, waNumber: true, role: true, email: true },
  });

  return NextResponse.json(members);
}

// ── POST /api/family/members ──────────────────────────────────────────────────
// Admin menambah anggota baru berdasarkan nomor WA.
// Jika nomor WA sudah terdaftar sebagai user lain di sistem,
// langsung hubungkan. Jika belum, buat user stub tanpa email/password.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.user as typeof session.user & {
    familyId?: string;
    role?: string;
  };

  if (!admin.familyId) {
    return NextResponse.json(
      { error: "Belum bergabung ke keluarga." },
      { status: 400 }
    );
  }

  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah anggota." },
      { status: 403 }
    );
  }

  let body: { waNumber: string; name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (!body.waNumber || !body.name) {
    return NextResponse.json(
      { error: "waNumber dan name wajib diisi." },
      { status: 422 }
    );
  }

  // Normalisasi nomor WA
  const waNumber = normalizeWaNumber(body.waNumber);

  // Cek apakah nomor WA sudah terdaftar di keluarga ini
  const existingInFamily = await db.query.users.findFirst({
    where: and(
      eq(users.waNumber, waNumber),
      eq(users.familyId, admin.familyId)
    ),
  });

  if (existingInFamily) {
    return NextResponse.json(
      { error: "Nomor WA ini sudah terdaftar di keluarga." },
      { status: 409 }
    );
  }

  // Cek apakah sudah ada user dengan nomor WA ini (di keluarga lain atau belum punya keluarga)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.waNumber, waNumber),
  });

  if (existingUser) {
    if (existingUser.familyId && existingUser.familyId !== admin.familyId) {
      return NextResponse.json(
        { error: "Nomor WA ini sudah terdaftar di keluarga lain." },
        { status: 409 }
      );
    }

    // Hubungkan user yang sudah ada ke keluarga ini
    await db
      .update(users)
      .set({ familyId: admin.familyId, role: "member" })
      .where(eq(users.id, existingUser.id));

    return NextResponse.json({
      id: existingUser.id,
      name: existingUser.name,
      waNumber,
      role: "member",
    });
  }

  // Buat user stub (hanya nama + nomor WA, belum bisa login via web)
  const [newMember] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: body.name.trim(),
      email: `wa_${waNumber}@stub.catatjajan.local`, // placeholder, tidak bisa login
      emailVerified: false,
      waNumber,
      familyId: admin.familyId,
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: users.id, name: users.name, waNumber: users.waNumber, role: users.role });

  return NextResponse.json(newMember, { status: 201 });
}

// ── DELETE /api/family/members?userId=xxx ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.user as typeof session.user & {
    familyId?: string;
    role?: string;
  };

  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menghapus anggota." },
      { status: 403 }
    );
  }

  const targetUserId = req.nextUrl.searchParams.get("userId");

  if (!targetUserId) {
    return NextResponse.json({ error: "userId wajib diisi." }, { status: 422 });
  }

  if (targetUserId === session.user.id) {
    return NextResponse.json(
      { error: "Admin tidak bisa menghapus dirinya sendiri." },
      { status: 400 }
    );
  }

  // Pastikan target user memang anggota keluarga admin ini
  const target = await db.query.users.findFirst({
    where: and(
      eq(users.id, targetUserId),
      eq(users.familyId, admin.familyId ?? "")
    ),
  });

  if (!target) {
    return NextResponse.json(
      { error: "Anggota tidak ditemukan di keluarga ini." },
      { status: 404 }
    );
  }

  // Lepas dari keluarga (bukan hapus akun)
  await db
    .update(users)
    .set({ familyId: null, role: "member" })
    .where(eq(users.id, targetUserId));

  return NextResponse.json({ ok: true });
}

function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (!digits.startsWith("62")) return "62" + digits;
  return digits;
}
