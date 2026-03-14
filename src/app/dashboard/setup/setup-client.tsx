"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

interface Props { userName: string; }

const STEPS = [
  { icon: "📂", text: "9 kategori default otomatis ditambahkan" },
  { icon: "👑", text: "Kamu jadi admin keluarga" },
  { icon: "👥", text: "Tambahkan anggota di halaman Pengaturan" },
];

export default function SetupClient({ userName }: Props) {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
      gsap.fromTo(
        cardRef.current.querySelectorAll(".step-item"),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.45 }
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!familyName.trim()) { setError("Nama keluarga wajib diisi."); return; }
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
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div ref={cardRef} className="w-full max-w-md" style={{ opacity: 0 }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-btn mb-5 shadow-glow">
          <span className="text-4xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">Selamat datang!</h1>
        <p className="text-white/40 mt-2">
          Hei <span className="text-white/70 font-semibold">{userName}</span>, buat grup keluarga dulu yuk
        </p>
      </div>

      {/* Card form */}
      <div className="glass rounded-3xl p-7 space-y-5" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)" }}>
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-scale-in">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">
              Nama Keluarga
            </label>
            <input
              type="text"
              required
              placeholder='Contoh: "Keluarga Cemara"'
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="dark-input text-base"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn w-full py-3.5 rounded-2xl text-white font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Membuat Grup...
              </span>
            ) : "Buat Grup Keluarga →"}
          </button>
        </form>

        {/* Steps info */}
        <div className="pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Setelah grup dibuat</p>
          <ul className="space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={i} className="step-item flex items-center gap-3" style={{ opacity: 0 }}>
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center text-sm shrink-0">
                  {s.icon}
                </div>
                <span className="text-sm text-white/45">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
