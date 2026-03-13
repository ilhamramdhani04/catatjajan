"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  note: string | null;
  source: string;
  createdAt: Date;
  category: { name: string; icon: string | null };
  user: { name: string };
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  total: number;
  period: string;
}

function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function TransactionsClient({
  transactions: initialTxs,
  categories,
  total,
  period,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [txs, setTxs] = useState(initialTxs);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchPeriod(p: string) {
    startTransition(() => {
      router.push(`${pathname}?period=${p}`);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);

    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

    if (res.ok) {
      setTxs((prev) => prev.filter((t) => t.id !== id));
    }

    setDeletingId(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Transaksi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          + Tambah
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {["weekly", "monthly"].map((p) => (
          <button
            key={p}
            onClick={() => switchPeriod(p)}
            disabled={isPending}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              period === p
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p === "weekly" ? "Minggu Ini" : "Bulan Ini"}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          Total {period === "weekly" ? "Minggu Ini" : "Bulan Ini"}
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {formatRupiah(total)}
        </p>
        <p className="text-xs text-gray-400 mt-1">{txs.length} transaksi</p>
      </div>

      {/* Add form modal */}
      {showForm && (
        <AddTransactionForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onAdded={(t) => {
            setTxs((prev) => [t as Transaction, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {/* Transaction list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {txs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Belum ada transaksi di periode ini.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {txs.map((t) => (
              <li key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.category.icon} {t.category.name}
                    {t.note && (
                      <span className="ml-1 text-gray-400 font-normal">
                        · {t.note}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.user.name} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {t.source === "whatsapp" && (
                      <span className="ml-1 text-green-600">· WA</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatRupiah(t.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === t.id ? "..." : "Hapus"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Form tambah transaksi (modal overlay) ────────────────────────────────────

function AddTransactionForm({
  categories,
  onClose,
  onAdded,
}: {
  categories: Category[];
  onClose: () => void;
  onAdded: (t: unknown) => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount.replace(/\D/g, ""));
    if (!amountNum || amountNum <= 0) {
      setError("Jumlah harus berupa angka positif.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, amount: amountNum, note: note || undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan transaksi.");
      setLoading(false);
      return;
    }

    const created = await res.json();
    const cat = categories.find((c) => c.id === categoryId);

    // Inject relasi agar bisa langsung ditampilkan di list tanpa refresh
    onAdded({
      ...created,
      category: { name: cat?.name ?? "", icon: cat?.icon ?? null },
      user: { name: "Kamu" },
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Tambah Transaksi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan <span className="text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="nasi padang, kopi, dll"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
