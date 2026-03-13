const WA_API_BASE = "https://graph.facebook.com/v21.0";

interface TextMessage {
  to: string;
  text: string;
}

async function sendRequest(body: Record<string, unknown>): Promise<void> {
  const phoneId = process.env.WA_PHONE_NUMBER_ID;
  const token = process.env.WA_ACCESS_TOKEN;

  if (!phoneId || !token) {
    throw new Error("WA_PHONE_NUMBER_ID atau WA_ACCESS_TOKEN belum dikonfigurasi.");
  }

  const res = await fetch(`${WA_API_BASE}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${errorBody}`);
  }
}

/**
 * Kirim pesan teks biasa ke nomor WA.
 * @param to   - Nomor tujuan dengan format internasional tanpa '+' (contoh: "628123456789")
 * @param text - Isi pesan
 */
export async function sendTextMessage({ to, text }: TextMessage): Promise<void> {
  await sendRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

/**
 * Mark pesan sebagai "read" agar pengguna tahu bot telah memproses pesannya.
 */
export async function markAsRead(messageId: string): Promise<void> {
  await sendRequest({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

// ─── Template pesan reply ─────────────────────────────────────────────────────

export const replyTemplates = {
  success: (category: string, amount: number, note?: string) =>
    `Berhasil dicatat!\n*${category}*: Rp${amount.toLocaleString("id-ID")}${note ? `\nKeterangan: ${note}` : ""}`,

  unknownCategory: (input: string, suggestions: string[]) =>
    `Kategori "_${input}_" tidak ditemukan.\nMaksud kamu:\n${suggestions.map((s) => `• ${s}`).join("\n")}\n\nAtau ketik *bantuan* untuk melihat daftar kategori.`,

  parseError: () =>
    `Format tidak dikenali.\nContoh yang benar:\n• *makan 50000 nasi padang*\n• *jajan 25000 kopi*\n\nKetik *bantuan* untuk panduan lengkap.`,

  notRegistered: () =>
    `Nomor WA-mu belum terdaftar. Minta admin keluarga untuk mendaftarkanmu di dashboard.`,

  help: (categories: string[]) =>
    `*CatatJajan Bot*\n\nCara mencatat:\n*[kategori] [jumlah] [keterangan]*\n\nContoh:\n• makan 50000\n• jajan 25000 kopi susu\n\nKategori tersedia:\n${categories.map((c) => `• ${c}`).join("\n")}\n\nPerintah lain:\n• *laporan* — rekap minggu ini\n• *saldo* — total bulan ini`,

  weeklyReport: (
    familyName: string,
    total: number,
    breakdown: { category: string; amount: number }[]
  ) => {
    const lines = breakdown
      .map((b) => `• ${b.category}: Rp${b.amount.toLocaleString("id-ID")}`)
      .join("\n");
    return `*Rekap Mingguan — ${familyName}*\n\n${lines}\n\n*Total: Rp${total.toLocaleString("id-ID")}*`;
  },

  budgetWarning: (category: string, spent: number, budget: number) =>
    `Peringatan: pengeluaran *${category}* bulan ini sudah Rp${spent.toLocaleString("id-ID")} dari anggaran Rp${budget.toLocaleString("id-ID")}.`,
};
