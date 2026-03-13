"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userName: string;
}

export default function SetupClient({ userName }: Props) {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!familyName.trim()) {
      setError("Nama keluarga wajib diisi.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: familyName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal membuat keluarga, coba lagi.");
      setLoading(false);
      return;
    }

    // Refresh session agar familyId ter-update, lalu ke dashboard
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Selamat datang, {userName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Buat grup keluarga untuk mulai mencatat pengeluaran bersama.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Keluarga
          </label>
          <input
            type="text"
            placeholder='Contoh: "Keluarga Cemara"'
            required
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          {loading ? "Membuat..." : "Buat Grup Keluarga"}
        </button>
      </form>

      {/* Info: Apa yang terjadi setelah ini */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">Setelah grup dibuat:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>9 kategori default otomatis ditambahkan</li>
          <li>Kamu jadi admin keluarga</li>
          <li>Tambahkan anggota di halaman Pengaturan</li>
        </ul>
      </div>
    </div>
  );
}
