"use client";

import { useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import gsap from "gsap";

const GOLD_SHADES = ["#D4B483","#C9A96E","#BF9759","#B48544","#F0CE94","#E8C47E","#DDB968","#D3AF54","#C8A440"];

interface CategorySummary { categoryId: string; name: string; icon: string; total: number; }
interface Transaction { id: string; amount: number; note: string | null; createdAt: Date; source: string; category: { name: string; icon: string | null }; user: { name: string }; }
interface Category { id: string; name: string; icon: string | null; }
interface Props { weeklyTotal: number; monthlyTotal: number; pieData: CategorySummary[]; recentTransactions: Transaction[]; categories: Category[]; }

function formatRupiah(n: number) { return "Rp" + n.toLocaleString("id-ID"); }

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => { el.textContent = formatRupiah(Math.round(obj.val)); },
    });
  }, [value]);
  return <span ref={ref}>Rp0</span>;
}

export default function DashboardClient({ weeklyTotal, monthlyTotal, pieData, recentTransactions }: Props) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power3.out" }
      );
    }
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power2.out", delay: 0.35 }
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div ref={cardsRef} className="grid grid-cols-2 gap-4">
        <div className="noir-card-solid p-6 relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="bg-glow w-40 h-40" style={{ top: "-20px", right: "-20px", background: "rgba(212,180,131,0.06)" }} />
          <p className="label-xs mb-3">Minggu Ini</p>
          <p className="text-2xl font-bold" style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>
            <AnimatedNumber value={weeklyTotal} />
          </p>
          <div className="gold-line mt-4 w-8" />
        </div>
        <div className="noir-card-solid p-6 relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="bg-glow w-40 h-40" style={{ top: "-20px", right: "-20px", background: "rgba(212,180,131,0.04)" }} />
          <p className="label-xs mb-3">Bulan Ini</p>
          <p className="text-2xl font-bold" style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>
            <AnimatedNumber value={monthlyTotal} />
          </p>
          <div className="gold-line mt-4 w-8" />
        </div>
      </div>

      {/* Pie chart */}
      <div className="noir-card p-5 anim-fade-up d-2">
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--cream)" }}>Pengeluaran Bulan Ini</h2>
        <p className="label-xs mb-5">Per kategori</p>
        {pieData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-3" style={{ opacity: 0.3 }}>◈</p>
            <p className="text-sm" style={{ color: "var(--cream-dim)" }}>Belum ada transaksi bulan ini</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={52}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "rgba(212,180,131,0.25)" }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={GOLD_SHADES[i % GOLD_SHADES.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatRupiah(v)}
                contentStyle={{ background: "var(--black-2)", border: "1px solid var(--gold-border)", borderRadius: 12, color: "var(--cream)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown */}
      {pieData.length > 0 && (
        <div className="noir-card p-5 anim-fade-up d-3">
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--cream)" }}>Breakdown Kategori</h2>
          <p className="label-xs mb-5">Komposisi pengeluaran</p>
          <div className="space-y-3.5">
            {pieData.map((item, i) => {
              const max = pieData[0].total;
              const pct = (item.total / max) * 100;
              return (
                <div key={item.categoryId} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-medium truncate pr-2" style={{ color: "var(--cream)" }}>{item.name}</span>
                      <span className="text-xs shrink-0" style={{ color: "var(--gold)" }}>{formatRupiah(item.total)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="noir-card p-5 anim-fade-up d-4">
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--cream)" }}>Transaksi Terakhir</h2>
        <p className="label-xs mb-5">Minggu ini</p>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2" style={{ opacity: 0.2 }}>◈</p>
            <p className="text-sm" style={{ color: "var(--cream-dim)" }}>Belum ada transaksi minggu ini</p>
          </div>
        ) : (
          <ul ref={listRef} className="space-y-1">
            {recentTransactions.map((t) => (
              <li key={t.id} className="row-div group" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: "rgba(212,180,131,0.08)", border: "1px solid var(--gold-border)" }}>
                    {t.category.icon ?? "◈"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--cream)" }}>
                      {t.category.name}
                      {t.note && <span className="font-normal ml-1" style={{ color: "var(--cream-dim)" }}>· {t.note}</span>}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--cream-faint)" }}>
                      {t.user.name} · {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {t.source === "whatsapp" && <span className="ml-1" style={{ color: "var(--green)" }}>· WA</span>}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0 ml-3" style={{ color: "var(--gold)" }}>{formatRupiah(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
