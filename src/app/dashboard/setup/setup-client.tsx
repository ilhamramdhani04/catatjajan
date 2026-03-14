"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

interface Props { userName: string; }

const STEPS = [
  { icon: "◈", text: "9 kategori default otomatis ditambahkan" },
  { icon: "◑", text: "Kamu jadi admin keluarga" },
  { icon: "◎", text: "Tambahkan anggota di halaman Pengaturan" },
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
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.08, ease: "power2.out", delay: 0.5 }
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
        <div className="inline-flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(212,180,131,0.1)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
            ◈
          </div>
          <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "var(--gold-dim)" }}>Setup Keluarga</div>
        </div>
        <h1 className="text-2xl font-bold mt-2" style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>
          Selamat datang, {userName}
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--cream-dim)" }}>
          Buat grup keluarga untuk mulai mencatat
        </p>
      </div>

      {/* Form card */}
      <div className="noir-card-solid p-7 space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(224,96,96,0.08)", border: "1px solid rgba(224,96,96,0.2)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-xs block mb-3">Nama Keluarga</label>
            <input
              type="text"
              required
              placeholder='Contoh: "Keluarga Cemara"'
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="noir-input"
              autoFocus
            />
          </div>
          <div className="pt-1">
            <button type="submit" disabled={loading} className="btn-gold">
              {loading
                ? <><span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black anim-spin" />Membuat Grup...</>
                : "Buat Grup Keluarga"}
            </button>
          </div>
        </form>

        {/* Steps info */}
        <div className="pt-4" style={{ borderTop: "1px solid var(--gold-border)" }}>
          <p className="label-xs mb-3">Setelah grup dibuat</p>
          <ul className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={i} className="step-item flex items-center gap-3" style={{ opacity: 0 }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: "rgba(212,180,131,0.08)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
                  {s.icon}
                </div>
                <span className="text-sm" style={{ color: "var(--cream-dim)" }}>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
