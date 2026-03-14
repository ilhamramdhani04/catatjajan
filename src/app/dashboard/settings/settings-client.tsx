"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member { id: string; name: string; waNumber: string | null; role: string; email: string; }
interface Category { id: string; name: string; icon: string | null; isDefault: boolean; monthlyBudget: number | null; }
interface Props { isAdmin: boolean; currentUserId: string; members: Member[]; categories: Category[]; }
type ActiveTab = "members" | "budget";

const AVATAR_COLORS = ["from-purple-500 to-pink-500","from-orange-400 to-pink-400","from-teal-400 to-blue-500","from-pink-500 to-rose-500","from-violet-500 to-indigo-500"];

export default function SettingsClient({ isAdmin, currentUserId, members: initialMembers, categories: initialCategories }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("members");
  const [members, setMembers] = useState(initialMembers);
  const [categories, setCategories] = useState(initialCategories);

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold gradient-text">Pengaturan</h1>
        <p className="text-sm text-white/30 mt-1">Kelola keluarga dan anggaran kamu</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit glass animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {([["members", "👥 Anggota"], ["budget", "💎 Budget"]] as [ActiveTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
              tab === t ? "gradient-btn text-white shadow-glow" : "text-white/40 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
        {tab === "members" && <MembersTab isAdmin={isAdmin} currentUserId={currentUserId} members={members} onMembersChange={setMembers} onRefresh={() => router.refresh()} />}
        {tab === "budget" && <BudgetTab isAdmin={isAdmin} categories={categories} onCategoriesChange={setCategories} />}
      </div>
    </div>
  );
}

// ─── Tab Anggota ──────────────────────────────────────────────────────────────

function MembersTab({ isAdmin, currentUserId, members, onMembersChange, onRefresh }: { isAdmin: boolean; currentUserId: string; members: Member[]; onMembersChange: (m: Member[]) => void; onRefresh: () => void; }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/family/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, waNumber }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Gagal menambah anggota."); setLoading(false); return; }
    onMembersChange([...members, data]);
    setName(""); setWaNumber(""); setShowForm(false); setLoading(false);
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    const res = await fetch(`/api/family/members?userId=${userId}`, { method: "DELETE" });
    if (res.ok) { onMembersChange(members.filter((m) => m.id !== userId)); onRefresh(); }
    setRemovingId(null);
  }

  return (
    <div className="space-y-3">
      {/* Members grid */}
      <div className="grid gap-3">
        {members.map((m, i) => (
          <div key={m.id} className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white/90">{m.name}</p>
                  {m.id === currentUserId && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/25">Kamu</span>}
                  {m.role === "admin" && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/25">Admin</span>}
                </div>
                <p className="text-xs text-white/30 mt-0.5">{m.waNumber ?? "Belum ada nomor WA"}</p>
              </div>
            </div>
            {isAdmin && m.id !== currentUserId && (
              <button onClick={() => handleRemove(m.id)} disabled={removingId === m.id}
                className="text-xs text-red-500/60 hover:text-red-400 disabled:opacity-30 px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 transition-all">
                {removingId === m.id ? "..." : "Hapus"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add member */}
      {isAdmin && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="w-full glass rounded-2xl p-4 text-sm text-white/40 hover:text-white/70 border border-dashed hover:border-white/20 transition-all text-center">
              + Tambah Anggota
            </button>
          ) : (
            <div className="glass rounded-2xl p-5 space-y-3 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-white/70">Tambah Anggota Baru</h3>
              {error && <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/25">{error}</div>}
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Nama</label>
                    <input type="text" required placeholder="Budi" value={name} onChange={(e) => setName(e.target.value)} className="dark-input" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Nomor WA</label>
                    <input type="tel" required placeholder="08xxxxxxxxxx" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} className="dark-input" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl glass text-white/50 hover:text-white text-sm transition-all">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 gradient-btn py-2 rounded-xl text-white text-sm font-medium">
                    {loading ? "Menambah..." : "Tambah"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab Budget ───────────────────────────────────────────────────────────────

function BudgetTab({ isAdmin, categories, onCategoriesChange }: { isAdmin: boolean; categories: Category[]; onCategoriesChange: (c: Category[]) => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveBudget(catId: string) {
    setSaving(true);
    const budget = budgetInput === "" ? null : Number(budgetInput.replace(/\D/g, ""));
    const res = await fetch(`/api/categories/${catId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthlyBudget: budget }) });
    if (res.ok) {
      const updated = await res.json();
      onCategoriesChange(categories.map((c) => c.id === catId ? { ...c, monthlyBudget: updated.monthlyBudget } : c));
    }
    setEditingId(null); setSaving(false);
  }

  const ICON_BG = ["rgba(124,58,237,0.2)","rgba(219,39,119,0.2)","rgba(249,115,22,0.2)","rgba(20,184,166,0.2)","rgba(37,99,235,0.2)"];

  return (
    <div className="space-y-3">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white/70">Budget per Kategori</h2>
          <p className="text-xs text-white/30 mt-0.5">Bot kirim peringatan saat pengeluaran mencapai 90% budget</p>
        </div>
        <ul>
          {categories.map((cat, i) => (
            <li key={cat.id} className="px-4 py-3.5 flex items-center justify-between gap-4 border-b last:border-0 hover:bg-white/3 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: ICON_BG[i % ICON_BG.length] }}>
                  {cat.icon ?? "💰"}
                </div>
                <span className="text-sm font-medium text-white/80">{cat.name}</span>
              </div>

              {editingId === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="500000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="dark-input w-28 text-xs py-1.5"
                    autoFocus
                  />
                  <button onClick={() => handleSaveBudget(cat.id)} disabled={saving}
                    className="text-xs px-3 py-1.5 rounded-lg gradient-btn text-white font-medium disabled:opacity-50">
                    {saving ? "..." : "Simpan"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-white/40 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${cat.monthlyBudget ? "text-white/60" : "text-white/20"}`}>
                    {cat.monthlyBudget ? `Rp${cat.monthlyBudget.toLocaleString("id-ID")}/bln` : "Belum diset"}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingId(cat.id); setBudgetInput(cat.monthlyBudget?.toString() ?? ""); }}
                      className="text-xs px-3 py-1.5 rounded-xl glass text-white/50 hover:text-white transition-all"
                    >
                      Ubah
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
