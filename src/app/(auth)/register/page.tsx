"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Normalisasi nomor WA: hilangkan 0 di depan, tambahkan 62
  function normalizeWaNumber(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (!digits.startsWith("62")) return "62" + digits;
    return digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    const { error: authError } = await signUp.email({
      name,
      email,
      password,
      // waNumber dikirim sebagai field tambahan
      // @ts-expect-error -- Better Auth custom field
      waNumber: waNumber ? normalizeWaNumber(waNumber) : undefined,
      callbackURL: "/dashboard",
    });

    if (authError) {
      setError(
        authError.message ?? "Pendaftaran gagal. Coba lagi."
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">CatatJajan</h1>
          <p className="mt-1 text-sm text-gray-500">Buat akun baru</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
