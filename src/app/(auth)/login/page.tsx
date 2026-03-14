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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--black)" }}>

      <div className="bg-glow w-[500px] h-[500px]"
        style={{ top: "-120px", right: "-100px", background: "rgba(212,180,131,0.05)" }} />
      <div className="bg-glow w-[300px] h-[300px]"
        style={{ bottom: "-60px", left: "-60px", background: "rgba(212,180,131,0.04)" }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8 anim-fade-up">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "rgba(212,180,131,0.1)", border: "1px solid var(--gold-border)" }}>
              ◈
            </div>
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "var(--gold-dim)" }}>CatatJajan</div>
          </div>
        </div>

        <div className="noir-card-solid p-8 anim-fade-up d-2">
          <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--cream)", letterSpacing: "-0.02em" }}>
            Selamat datang kembali
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--cream-dim)" }}>
            Masuk untuk melihat catatan pengeluaran
          </p>

          {error && (
            <div className="anim-scale-in mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(224,96,96,0.08)", border: "1px solid rgba(224,96,96,0.2)", color: "var(--red)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-xs block mb-3">Email</label>
              <input type="email" required autoComplete="email" placeholder="nama@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="noir-input" />
            </div>
            <div>
              <label className="label-xs block mb-3">Password</label>
              <input type="password" required autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} className="noir-input" />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-gold">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black anim-spin" />Masuk...</>
                  : "Masuk"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm mt-6 anim-fade-up d-3" style={{ color: "var(--cream-faint)" }}>
          Belum punya akun?{" "}
          <Link href="/register" style={{ color: "var(--gold)" }}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}
