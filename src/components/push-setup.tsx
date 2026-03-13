"use client";

import { useEffect, useState } from "react";

/**
 * Komponen client-side yang menangani:
 * 1. Registrasi Service Worker (/sw.js)
 * 2. Minta izin notifikasi ke user
 * 3. Subscribe ke Web Push dan kirim subscription ke server
 *
 * Di-render di dalam DashboardLayout — tidak menampilkan UI apapun.
 */
export default function PushSetup() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    void registerAndSubscribe();
  }, []);

  async function registerAndSubscribe() {
    try {
      // 1. Daftarkan SW
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // 2. Cek apakah sudah subscribe
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setSubscribed(true);
        return;
      }

      // 3. Minta izin notifikasi
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // 4. Subscribe ke push server menggunakan VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 5. Kirim subscription ke server
      const subJSON = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJSON.endpoint,
          keys: subJSON.keys,
        }),
      });

      setSubscribed(true);
    } catch (err) {
      // Non-fatal — push notification hanya fitur tambahan
      console.warn("[PushSetup] Gagal subscribe:", err);
    }
  }

  // Tidak render apapun — hanya efek samping
  void subscribed;
  return null;
}

// ── Helper: konversi VAPID public key dari base64url ke Uint8Array ────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
