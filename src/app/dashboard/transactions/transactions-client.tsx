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
      <div className="flex items-center justify-between anim-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>Transaksi</h1>
          <p className="text-xs mt-1" style={{ color: "var(--gold-dim)" }}>Riwayat pengeluaran keluarga</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-gold"
          style={{ width: "auto", padding: "9px 18px", fontSize: "12px" }}
        >
          + Tambah
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1 p-1 rounded-xl w-fit anim-fade-up d-1"
        style={{ background: "var(--black-2)", border: "1px solid var(--gold-border)" }}>
        {[{ key: "weekly", label: "Minggu Ini" }, { key: "monthly", label: "Bulan Ini" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchPeriod(key)}
            disabled={isPending}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              period === key
                ? "btn-gold"
                : ""
            }`}
            style={period === key ? { width: "auto", padding: "7px 16px", fontSize: "11px" } : { color: "var(--cream-dim)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Total card */}
      <div className="noir-card-solid p-5 anim-fade-up d-2">
        <p className="label-xs mb-2">Total {period === "weekly" ? "Minggu Ini" : "Bulan Ini"}</p>
        <p className="text-4xl font-bold" style={{ color: "var(--cream)", letterSpacing: "-0.04em" }}>{formatRupiah(total)}</p>
        <p className="text-xs mt-2" style={{ color: "var(--gold-dim)" }}>{txs.length} transaksi</p>
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
      <div className="noir-card-solid overflow-hidden anim-fade-up d-3">
        {txs.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-3xl mb-3" style={{ opacity: 0.3 }}>◈</p>
            <p className="text-sm" style={{ color: "var(--cream-faint)" }}>Belum ada transaksi di periode ini</p>
          </div>
        ) : (
          <ul ref={listRef}>
            {txs.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 row-div group transition-colors"
                onMouseEnter={(e) => (e.currentTarget as HTMLLIElement).style.background = "var(--gold-glow)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLLIElement).style.background = "transparent"}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: "rgba(212,180,131,0.08)", border: "1px solid var(--gold-border)" }}
                  >
                    {t.category.icon ?? "◈"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--cream)" }}>
                      {t.category.name}
                      {t.note && <span className="font-normal ml-1" style={{ color: "var(--cream-faint)" }}>· {t.note}</span>}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--gold-dim)" }}>
                      {t.user.name} · {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {t.source === "whatsapp" && <span className="ml-1" style={{ color: "var(--green)" }}>· WA</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>{formatRupiah(t.amount)}</span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="text-xs disabled:opacity-30 px-2 py-1 rounded-lg transition-all"
                    style={{ color: "rgba(224,96,96,0.5)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--red)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(224,96,96,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(224,96,96,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
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
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.93, y: 28 }, { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.4)" });
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
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={modalRef} className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "var(--black-2)", border: "1px solid var(--gold-border)", opacity: 0, boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--cream)" }}>Tambah Transaksi</h2>
            <p className="label-xs mt-0.5">Catat pengeluaran baru</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-xl transition-colors"
            style={{ color: "var(--cream-dim)", border: "1px solid var(--gold-border)" }}>×</button>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: "rgba(224,96,96,0.08)", border: "1px solid rgba(224,96,96,0.2)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-xs block mb-2.5">Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="noir-input-box">
              {categories.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--black-2)" }}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs block mb-2.5">Jumlah (Rp)</label>
            <input type="text" required inputMode="numeric" placeholder="50000"
              value={amount} onChange={(e) => setAmount(e.target.value)} className="noir-input-box" />
          </div>
          <div>
            <label className="label-xs block mb-2.5">Keterangan <span style={{ color: "var(--cream-faint)", textTransform: "none", letterSpacing: 0 }}>(opsional)</span></label>
            <input type="text" placeholder="nasi padang, kopi, dll"
              value={note} onChange={(e) => setNote(e.target.value)} className="noir-input-box" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Batal</button>
            <button type="submit" disabled={loading} className="btn-gold flex-1" style={{ flex: 1 }}>
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
