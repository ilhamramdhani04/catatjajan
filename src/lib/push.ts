import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Inisialisasi VAPID — dipanggil saat modul dimuat
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@catatjajan.local";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;           // URL yang dibuka saat notif diklik
  tag?: string;           // Deduplikasi: notif dengan tag sama akan di-replace
}

/**
 * Kirim push notification ke semua subscription milik satu user.
 * Subscription yang expired/invalid otomatis dihapus dari DB.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys belum dikonfigurasi, skip push.");
    return;
  }

  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  const notification = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification
        );
      } catch (err: unknown) {
        // 410 Gone = subscription tidak valid lagi, hapus dari DB
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error(`[Push] Error kirim ke ${sub.endpoint.slice(0, 40)}:`, err);
        }
      }
    })
  );
}

/**
 * Kirim push notification ke semua anggota keluarga yang punya subscription.
 */
export async function sendPushToFamily(
  familyId: string,
  payload: PushPayload
): Promise<void> {
  const members = await db.query.users.findMany({
    where: eq(users.familyId, familyId),
    columns: { id: true },
  });

  await Promise.allSettled(
    members.map((m) => sendPushToUser(m.id, payload))
  );
}
