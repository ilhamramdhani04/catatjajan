"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";

interface Category { id: string; name: string; icon: string | null; }
interface Transaction { id: string; amount: number; note: string | null; source: string; createdAt: Date; category: { name: string; icon: string | null }; user: { name: string }; }
interface Props { transactions: Transaction[]; categories: Category[]; total: number; period: string; }

function formatRupiah(n: number) { return "Rp" + n.toLocaleString("id-ID"); }

export default function TransactionsClient({ transactions: initialTxs, categories, total, period }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [txs, setTxs] = useState(initialTxs);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, []);

  function switchPeriod(p: string) {
    startTransition(() => { router.push(`${pathname}?period=${p}`); });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) setTxs((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Transaksi</h1>
          <p className="text-sm text-white/30 mt-0.5">Riwayat pengeluaran kamu</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-btn px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-1.5"
        >
          <span>+</span> Tambah
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit glass animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {[{ key: "weekly", label: "Minggu Ini" }, { key: "monthly", label: "Bulan Ini" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchPeriod(key)}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              period === key ? "gradient-btn text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Total card */}
      <div className="card-purple rounded-2xl p-5 relative overflow-hidden animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="orb w-32 h-32 bg-purple-600 top-[-20px] right-[-20px]" style={{ filter: "blur(40px)", opacity: 0.25 }} />
        <p className="text-xs font-semibold text-purple-300/60 uppercase tracking-widest">
          Total {period === "weekly" ? "Minggu Ini" : "Bulan Ini"}
        </p>
        <p className="text-4xl font-bold text-white mt-2">{formatRupiah(total)}</p>
        <p className="text-sm text-white/30 mt-1">{txs.length} transaksi</p>
      </div>

      {/* Modal */}
      {showForm && (
        <AddTransactionForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onAdded={(t) => { setTxs((prev) => [t as Transaction, ...prev]); setShowForm(false); }}
        />
      )}

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {txs.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-white/30">Belum ada transaksi di periode ini</p>
          </div>
        ) : (
          <ul ref={listRef}>
            {txs.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 border-b last:border-0 hover:bg-white/3 transition-colors group"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: ["rgba(124,58,237,0.2)","rgba(219,39,119,0.2)","rgba(249,115,22,0.2)","rgba(20,184,166,0.2)","rgba(37,99,235,0.2)"][i % 5] }}
                  >
                    {t.category.icon ?? "💰"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                      {t.category.name}
                      {t.note && <span className="text-white/35 font-normal"> · {t.note}</span>}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {t.user.name} · {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {t.source === "whatsapp" && <span className="ml-1 text-green-400/70">· WA</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-white/85">{formatRupiah(t.amount)}</span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="text-xs text-red-500/60 hover:text-red-400 disabled:opacity-30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
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

// ─── Modal Tambah Transaksi ───────────────────────────────────────────────────

function AddTransactionForm({ categories, onClose, onAdded }: { categories: Category[]; onClose: () => void; onAdded: (t: unknown) => void; }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.92, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNum = Number(amount.replace(/\D/g, ""));
    if (!amountNum || amountNum <= 0) { setError("Jumlah harus berupa angka positif."); return; }
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
    onAdded({ ...created, category: { name: cat?.name ?? "", icon: cat?.icon ?? null }, user: { name: "Kamu" } });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={modalRef} className="w-full max-w-md rounded-3xl p-6 space-y-4" style={{ background: "#0e0e1c", border: "1px solid rgba(255,255,255,0.1)", opacity: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Tambah Transaksi</h2>
            <p className="text-xs text-white/30 mt-0.5">Catat pengeluaran baru</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl">×</button>
        </div>

        {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="dark-input">
              {categories.map((c) => <option key={c.id} value={c.id} style={{ background: "#0e0e1c" }}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Jumlah (Rp)</label>
            <input type="text" required inputMode="numeric" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="dark-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Keterangan <span className="text-white/20 normal-case">(opsional)</span>
            </label>
            <input type="text" placeholder="nasi padang, kopi, dll" value={note} onChange={(e) => setNote(e.target.value)} className="dark-input" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl glass text-white/60 hover:text-white text-sm font-medium transition-all">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 gradient-btn py-2.5 rounded-xl text-white text-sm font-semibold">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Menyimpan...</span>
                : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
