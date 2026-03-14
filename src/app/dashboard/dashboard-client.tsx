"use client";

import { useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import gsap from "gsap";

const COLORS = ["#a78bfa","#f472b6","#fb923c","#34d399","#60a5fa","#f87171","#c084fc","#fbbf24","#2dd4bf"];

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
      duration: 1.4,
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
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }
      );
    }
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: "power2.out", delay: 0.3 }
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div ref={cardsRef} className="grid grid-cols-2 gap-4">
        <div className="card-purple rounded-2xl p-5 relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="orb w-24 h-24 bg-purple-500 top-[-10px] right-[-10px]" style={{ filter: "blur(30px)", opacity: 0.3 }} />
          <p className="text-xs font-semibold text-purple-300/70 uppercase tracking-widest">Minggu Ini</p>
          <p className="text-2xl font-bold text-white mt-2">
            <AnimatedNumber value={weeklyTotal} />
          </p>
          <div className="mt-3 text-2xl">📅</div>
        </div>
        <div className="card-pink rounded-2xl p-5 relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="orb w-24 h-24 bg-pink-500 top-[-10px] right-[-10px]" style={{ filter: "blur(30px)", opacity: 0.3 }} />
          <p className="text-xs font-semibold text-pink-300/70 uppercase tracking-widest">Bulan Ini</p>
          <p className="text-2xl font-bold text-white mt-2">
            <AnimatedNumber value={monthlyTotal} />
          </p>
          <div className="mt-3 text-2xl">📊</div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
          Pengeluaran Bulan Ini per Kategori
        </h2>
        {pieData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-white/30">Belum ada transaksi bulan ini</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatRupiah(v)}
                contentStyle={{ background: "rgba(14,14,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f0f0f8" }}
              />
              <Legend
                formatter={(v) => <span style={{ color: "rgba(240,240,248,0.7)", fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown */}
      {pieData.length > 0 && (
        <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            Breakdown Kategori
          </h2>
          <div className="space-y-2.5">
            {pieData.map((item, i) => {
              const max = pieData[0].total;
              const pct = (item.total / max) * 100;
              return (
                <div key={item.categoryId} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-white/70 truncate">{item.name}</span>
                      <span className="text-xs text-white/50 ml-2 shrink-0">{formatRupiah(item.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
          Transaksi Terakhir
        </h2>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🌙</p>
            <p className="text-sm text-white/30">Belum ada transaksi minggu ini</p>
          </div>
        ) : (
          <ul ref={listRef} className="space-y-2">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/4 transition-colors group" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl glass flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform">
                    {t.category.icon ?? "💰"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                      {t.category.name}
                      {t.note && <span className="text-white/40 font-normal ml-1">· {t.note}</span>}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {t.user.name} ·{" "}
                      {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {t.source === "whatsapp" && <span className="ml-1 text-green-400/80">· WA</span>}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-white/90 shrink-0 ml-3">{formatRupiah(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
