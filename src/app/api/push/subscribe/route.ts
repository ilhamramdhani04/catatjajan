import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// ── POST /api/push/subscribe ──────────────────────────────────────────────────
// Menyimpan atau memperbarui Web Push subscription.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint: string; keys: { p256dh: string; auth: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "endpoint, keys.p256dh, dan keys.auth wajib diisi." },
      { status: 422 }
    );
  }

  // Upsert berdasarkan endpoint (satu device = satu endpoint)
  const existing = await db.query.pushSubscriptions.findFirst({
    where: eq(pushSubscriptions.endpoint, endpoint),
  });

  if (existing) {
    // Update jika keys berubah (refresh token)
    if (existing.userId !== session.user.id) {
      // Endpoint dipakai user lain (browser di-share) — hapus yang lama
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      await db
        .update(pushSubscriptions)
        .set({ p256dh: keys.p256dh, auth: keys.auth })
        .where(eq(pushSubscriptions.id, existing.id));

      return NextResponse.json({ ok: true, updated: true });
    }
  }

  await db.insert(pushSubscriptions).values({
    userId: session.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  return NextResponse.json({ ok: true, created: true }, { status: 201 });
}

// ── DELETE /api/push/subscribe ────────────────────────────────────────────────
// Hapus subscription saat user unsubscribe (logout atau toggle notif).
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint wajib diisi." }, { status: 422 });
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, body.endpoint),
        eq(pushSubscriptions.userId, session.user.id)
      )
    );

  return NextResponse.json({ ok: true });
}
