"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (!digits.startsWith("62")) return "62" + digits;
  return digits;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
    setLoading(true);
    const { error: authError } = await signUp.email({
      name, email, password,
      // @ts-expect-error -- Better Auth custom field
      waNumber: waNumber ? normalizeWaNumber(waNumber) : undefined,
      callbackURL: "/dashboard",
    });
    if (authError) {
      setError(authError.message ?? "Pendaftaran gagal. Coba lagi.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-80 h-80 bg-violet-600 top-[-80px] right-[-60px] animate-blob" />
      <div className="orb w-96 h-96 bg-pink-600 bottom-[-80px] left-[-80px] animate-blob2" />
      <div className="orb w-56 h-56 bg-teal-500 top-1/3 left-10 animate-float2" />

      {/* Floating shapes */}
      <div className="absolute top-16 right-16 w-10 h-10 rounded-2xl card-orange animate-float opacity-50" />
      <div className="absolute bottom-40 right-24 w-8 h-8 rounded-xl card-purple animate-float3 opacity-40" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="glass rounded-3xl p-8 shadow-2xl" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)" }}>
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-btn mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Buat Akun</h1>
            <p className="text-sm text-white/40 mt-1">Bergabung dengan CatatJajan</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-scale-in">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
              <input type="text" required placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="dark-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="dark-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nomor WhatsApp</label>
              <input type="tel" placeholder="08xxxxxxxxxx" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} className="dark-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" required autoComplete="new-password" placeholder="Min. 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} className="dark-input" />
            </div>
            <button type="submit" disabled={loading} className="gradient-btn w-full py-3 rounded-xl text-white font-semibold text-sm mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Mendaftar...
                </span>
              ) : "Daftar Sekarang →"}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-5">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
