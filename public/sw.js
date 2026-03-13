/* =============================================================================
   CatatJajan Service Worker
   Daftarkan di: src/app/(dashboard)/layout.tsx
   ============================================================================= */

const CACHE_NAME = "catatjajan-v1";

// ── Install: pre-cache aset statis minimal ────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/dashboard", "/manifest.json"])
    )
  );
  self.skipWaiting();
});

// ── Activate: bersihkan cache lama ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ── Push: tampilkan notifikasi ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CatatJajan", body: event.data.text() };
  }

  const { title = "CatatJajan", body = "", url = "/dashboard", tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      tag: tag ?? "catatjajan-notif",
      data: { url },
      renotify: true,
    })
  );
});

// ── Notification click: buka dashboard ───────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Fokus ke tab yang sudah terbuka jika ada
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Buka tab baru
        return self.clients.openWindow(targetUrl);
      })
  );
});
