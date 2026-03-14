"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member { id: string; name: string; waNumber: string | null; role: string; email: string; }
interface Category { id: string; name: string; icon: string | null; isDefault: boolean; monthlyBudget: number | null; }
interface Props { isAdmin: boolean; currentUserId: string; members: Member[]; categories: Category[]; }
type ActiveTab = "members" | "budget";

export default function SettingsClient({ isAdmin, currentUserId, members: initialMembers, categories: initialCategories }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("members");
  const [members, setMembers] = useState(initialMembers);
  const [categories, setCategories] = useState(initialCategories);

  return (
    <div className="space-y-6">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>Pengaturan</h1>
        <p className="text-xs mt-1" style={{ color: "var(--gold-dim)" }}>Kelola keluarga dan anggaran</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit anim-fade-up d-1"
        style={{ background: "var(--black-2)", border: "1px solid var(--gold-border)" }}>
        {([["members", "Anggota"], ["budget", "Budget"]] as [ActiveTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 text-xs font-semibold rounded-lg transition-all"
            style={tab === t
              ? { background: "linear-gradient(135deg,#C8A45A,#E8C87A,#C8A45A)", color: "#08070F" }
              : { color: "var(--cream-dim)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="anim-fade-up d-2">
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
      <div className="noir-card-solid overflow-hidden">
        {members.map((m, i) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5 row-div transition-colors"
            onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "var(--gold-glow)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "rgba(212,180,131,0.1)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: "var(--cream)" }}>{m.name}</p>
                  {m.id === currentUserId && (
                    <span className="badge badge-gold">Kamu</span>
                  )}
                  {m.role === "admin" && (
                    <span className="badge" style={{ background: "rgba(212,180,131,0.12)", color: "var(--gold-bright)", border: "1px solid var(--gold-border)" }}>Admin</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--gold-dim)" }}>{m.waNumber ?? "Belum ada nomor WA"}</p>
              </div>
            </div>
            {isAdmin && m.id !== currentUserId && (
              <button onClick={() => handleRemove(m.id)} disabled={removingId === m.id}
                className="text-xs disabled:opacity-30 px-2.5 py-1.5 rounded-lg transition-all"
                style={{ color: "rgba(224,96,96,0.5)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--red)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(224,96,96,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(224,96,96,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                {removingId === m.id ? "..." : "Hapus"}
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full py-3.5 rounded-xl text-xs font-medium transition-all text-center"
              style={{ border: "1px dashed var(--gold-border)", color: "var(--gold-dim)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-glow)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-dim)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              + Tambah Anggota
            </button>
          ) : (
            <div className="noir-card-solid p-5 space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Tambah Anggota Baru</h3>
              {error && (
                <div className="text-sm px-3 py-2 rounded-xl"
                  style={{ background: "rgba(224,96,96,0.08)", border: "1px solid rgba(224,96,96,0.2)", color: "var(--red)" }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-xs block mb-2">Nama</label>
                    <input type="text" required placeholder="Budi" value={name} onChange={(e) => setName(e.target.value)} className="noir-input" />
                  </div>
                  <div>
                    <label className="label-xs block mb-2">Nomor WA</label>
                    <input type="tel" required placeholder="08xxxxxxxxxx" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} className="noir-input" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>Batal</button>
                  <button type="submit" disabled={loading} className="btn-gold" style={{ flex: 1 }}>
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

  return (
    <div>
      <div className="noir-card-solid overflow-hidden">
        <div className="px-5 py-4 gold-line">
          <h2 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Budget per Kategori</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--gold-dim)" }}>Bot kirim peringatan saat mencapai 90% budget</p>
        </div>
        <ul>
          {categories.map((cat) => (
            <li key={cat.id} className="px-4 py-3.5 flex items-center justify-between gap-4 row-div transition-colors"
              onMouseEnter={(e) => (e.currentTarget as HTMLLIElement).style.background = "var(--gold-glow)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLLIElement).style.background = "transparent"}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: "rgba(212,180,131,0.08)", border: "1px solid var(--gold-border)" }}>
                  {cat.icon ?? "◈"}
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--cream)" }}>{cat.name}</span>
              </div>

              {editingId === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="500000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="noir-input"
                    style={{ width: "7rem", fontSize: "12px" }}
                    autoFocus
                  />
                  <button onClick={() => handleSaveBudget(cat.id)} disabled={saving}
                    className="btn-gold disabled:opacity-50"
                    style={{ width: "auto", padding: "6px 12px", fontSize: "11px" }}>
                    {saving ? "..." : "Simpan"}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="text-xs px-2 py-1.5 rounded-lg transition-all"
                    style={{ color: "var(--cream-dim)" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--cream)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--cream-dim)"}
                  >Batal</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: cat.monthlyBudget ? "var(--gold-dim)" : "var(--cream-faint)" }}>
                    {cat.monthlyBudget ? `Rp${cat.monthlyBudget.toLocaleString("id-ID")}/bln` : "Belum diset"}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingId(cat.id); setBudgetInput(cat.monthlyBudget?.toString() ?? ""); }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ color: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-glow)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-dim)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
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
