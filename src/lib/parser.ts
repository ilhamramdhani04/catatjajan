export interface ParsedMessage {
  categoryRaw: string;   // kata pertama, sebelum dicocokkan ke DB
  amount: number;
  note?: string;
}

export type ParseResult =
  | { ok: true; data: ParsedMessage }
  | { ok: false; reason: "format" | "amount_zero" | "amount_invalid" };

/**
 * Normalkan angka dari berbagai format input:
 * - "50000"  → 50000
 * - "50.000" → 50000
 * - "50k"    → 50000
 * - "50rb"   → 50000
 * - "1jt"    → 1000000
 * - "1.5jt"  → 1500000
 */
export function parseAmount(raw: string): number | null {
  const lower = raw.toLowerCase();

  // Cek suffix jt/juta SEBELUM stripping titik, agar "1.5jt" tidak jadi "15jt"
  const jtMatch = lower.match(/^(\d+(?:[.,]\d+)?)jt$/);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(",", "."));
    return isNaN(num) ? null : Math.round(num * 1_000_000);
  }

  // Cek suffix k/rb/ribu
  const kMatch = lower.match(/^(\d+(?:[.,]\d+)?)(k|rb|ribu)$/);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(",", "."));
    return isNaN(num) ? null : Math.round(num * 1_000);
  }

  // Plain number: strip titik sebagai pemisah ribuan Indonesia (50.000 → 50000)
  const cleaned = lower.replace(/\./g, "").replace(/,/g, ".");
  const plain = parseFloat(cleaned);
  if (!Number.isNaN(plain) && Number.isFinite(plain)) return Math.round(plain);

  return null;
}

/**
 * Parse pesan teks dari WhatsApp.
 *
 * Format yang diterima:
 *   {kategori} {jumlah} [{keterangan}]
 *
 * Contoh:
 *   "makan 50000 nasi padang"  → { categoryRaw: "makan", amount: 50000, note: "nasi padang" }
 *   "jajan 25k"                → { categoryRaw: "jajan", amount: 25000 }
 *   "belanja 1.5jt baju anak"  → { categoryRaw: "belanja", amount: 1500000, note: "baju anak" }
 *
 * Edge cases yang ditangani:
 *   - Spasi berlebih
 *   - Huruf kapital
 *   - Pesan terlalu pendek (kurang dari 2 token)
 *   - Amount 0 atau tidak valid
 */
export function parseTransactionMessage(text: string): ParseResult {
  const tokens = text.trim().toLowerCase().replace(/\s+/g, " ").split(" ");

  // Minimum: {kategori} {jumlah}
  if (tokens.length < 2) {
    return { ok: false, reason: "format" };
  }

  const [categoryRaw, amountRaw, ...noteParts] = tokens;

  const amount = parseAmount(amountRaw);

  if (amount === null) {
    return { ok: false, reason: "amount_invalid" };
  }

  if (amount <= 0) {
    return { ok: false, reason: "amount_zero" };
  }

  const note = noteParts.length > 0 ? noteParts.join(" ") : undefined;

  return { ok: true, data: { categoryRaw, amount, note } };
}

/**
 * Fuzzy match: temukan kategori yang paling mirip dengan input pengguna.
 * Menggunakan simple Levenshtein distance — tanpa dependensi eksternal.
 *
 * @param input      - Kata yang diketik pengguna (sudah lowercase)
 * @param categories - Daftar nama kategori dari DB (lowercase)
 * @param threshold  - Jarak maksimum yang masih dianggap cocok (default: 3)
 * @returns Nama kategori yang cocok, atau null jika tidak ada
 */
export function fuzzyMatchCategory(
  input: string,
  categories: string[],
  threshold = 3
): { match: string; distance: number } | null {
  let best: { match: string; distance: number } | null = null;

  for (const cat of categories) {
    const dist = levenshtein(input, cat.toLowerCase());
    if (dist <= threshold && (best === null || dist < best.distance)) {
      best = { match: cat, distance: dist };
    }
  }

  return best;
}

/** Cari semua saran (untuk ditampilkan ke pengguna jika tidak exact match) */
export function getSuggestions(
  input: string,
  categories: string[],
  maxSuggestions = 3,
  threshold = 4
): string[] {
  return categories
    .map((cat) => ({ name: cat, dist: levenshtein(input, cat.toLowerCase()) }))
    .filter((c) => c.dist <= threshold)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxSuggestions)
    .map((c) => c.name);
}

// ── Levenshtein distance (iterative, O(m*n)) ──────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
