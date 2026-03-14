"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await signIn.email({ email, password, callbackURL: "/dashboard" });
    if (authError) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-purple-600 top-[-100px] left-[-80px] animate-blob" />
      <div className="orb w-80 h-80 bg-pink-600 bottom-[-60px] right-[-60px] animate-blob2" />
      <div className="orb w-64 h-64 bg-orange-500 top-1/2 right-10 animate-float2" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-12 h-12 rounded-2xl card-purple animate-float opacity-60" />
      <div className="absolute top-40 right-20 w-8 h-8 rounded-xl card-pink animate-float3 opacity-50" />
      <div className="absolute bottom-32 left-20 w-10 h-10 rounded-full card-teal animate-float2 opacity-50" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="glass rounded-3xl p-8 shadow-2xl" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)" }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-btn mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">CatatJajan</h1>
            <p className="text-sm text-white/40 mt-1">Masuk ke akun kamu</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-scale-in">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dark-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Masuk...
                </span>
              ) : "Masuk →"}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Belum punya akun?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
