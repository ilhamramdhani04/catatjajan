"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string;
  waNumber: string | null;
  role: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
  monthlyBudget: number | null;
}

interface Props {
  isAdmin: boolean;
  currentUserId: string;
  members: Member[];
  categories: Category[];
}

type ActiveTab = "members" | "budget";

export default function SettingsClient({
  isAdmin,
  currentUserId,
  members: initialMembers,
  categories: initialCategories,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("members");
  const [members, setMembers] = useState(initialMembers);
  const [categories, setCategories] = useState(initialCategories);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["members", "budget"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "members" ? "Anggota Keluarga" : "Budget Kategori"}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <MembersTab
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          members={members}
          onMembersChange={setMembers}
          onRefresh={() => router.refresh()}
        />
      )}
      {tab === "budget" && (
        <BudgetTab
          isAdmin={isAdmin}
          categories={categories}
          onCategoriesChange={setCategories}
        />
      )}
    </div>
  );
}

// ─── Tab Anggota ──────────────────────────────────────────────────────────────

function MembersTab({
  isAdmin,
  currentUserId,
  members,
  onMembersChange,
  onRefresh,
}: {
  isAdmin: boolean;
  currentUserId: string;
  members: Member[];
  onMembersChange: (m: Member[]) => void;
  onRefresh: () => void;
}) {
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

    const res = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, waNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Gagal menambah anggota.");
      setLoading(false);
      return;
    }

    onMembersChange([...members, data]);
    setName("");
    setWaNumber("");
    setShowForm(false);
    setLoading(false);
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);

    const res = await fetch(`/api/family/members?userId=${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onMembersChange(members.filter((m) => m.id !== userId));
      onRefresh();
    }

    setRemovingId(null);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">
          Anggota ({members.length})
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {showForm ? "Batal" : "+ Tambah"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddMember} className="px-5 py-4 border-b border-gray-100 bg-blue-50 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                required
                placeholder="Budi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nomor WA
              </label>
              <input
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Menambah..." : "Tambah Anggota"}
          </button>
        </form>
      )}

      <ul className="divide-y divide-gray-100">
        {members.map((m) => (
          <li key={m.id} className="px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {m.name}
                {m.id === currentUserId && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Kamu
                  </span>
                )}
                {m.role === "admin" && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {m.waNumber ?? "Belum ada nomor WA"}
              </p>
            </div>
            {isAdmin && m.id !== currentUserId && (
              <button
                onClick={() => handleRemove(m.id)}
                disabled={removingId === m.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {removingId === m.id ? "..." : "Hapus"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Tab Budget ───────────────────────────────────────────────────────────────

function BudgetTab({
  isAdmin,
  categories,
  onCategoriesChange,
}: {
  isAdmin: boolean;
  categories: Category[];
  onCategoriesChange: (c: Category[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveBudget(catId: string) {
    setSaving(true);

    const budget = budgetInput === "" ? null : Number(budgetInput.replace(/\D/g, ""));

    const res = await fetch(`/api/categories/${catId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget: budget }),
    });

    if (res.ok) {
      const updated = await res.json();
      onCategoriesChange(
        categories.map((c) => (c.id === catId ? { ...c, monthlyBudget: updated.monthlyBudget } : c))
      );
    }

    setEditingId(null);
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Budget per Kategori</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Atur batas pengeluaran bulanan. Bot akan kirim peringatan saat mencapai 90%.
        </p>
      </div>
      <ul className="divide-y divide-gray-100">
        {categories.map((cat) => (
          <li key={cat.id} className="px-5 py-3 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-900">
              {cat.icon} {cat.name}
            </span>

            {editingId === cat.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Contoh: 500000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-32 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveBudget(cat.id)}
                  disabled={saving}
                  className="text-sm text-blue-600 font-medium disabled:opacity-50"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm text-gray-400"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {cat.monthlyBudget
                    ? `Rp${cat.monthlyBudget.toLocaleString("id-ID")}/bulan`
                    : "–"}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setBudgetInput(cat.monthlyBudget?.toString() ?? "");
                    }}
                    className="text-xs text-blue-500 hover:underline"
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
  );
}
