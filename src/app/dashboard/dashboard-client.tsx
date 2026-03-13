"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316",
];

interface CategorySummary {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
}

interface Transaction {
  id: string;
  amount: number;
  note: string | null;
  createdAt: Date;
  source: string;
  category: { name: string; icon: string | null };
  user: { name: string };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Props {
  weeklyTotal: number;
  monthlyTotal: number;
  pieData: CategorySummary[];
  recentTransactions: Transaction[];
  categories: Category[];
}

function formatRupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function DashboardClient({
  weeklyTotal,
  monthlyTotal,
  pieData,
  recentTransactions,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Minggu Ini</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatRupiah(weeklyTotal)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Bulan Ini</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatRupiah(monthlyTotal)}
          </p>
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Pengeluaran Bulan Ini per Kategori
        </h2>
        {pieData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Belum ada transaksi bulan ini.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatRupiah(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Transaksi Terakhir (Minggu Ini)
        </h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Belum ada transaksi minggu ini.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentTransactions.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t.category.icon} {t.category.name}
                    {t.note && (
                      <span className="ml-1 text-gray-400 font-normal">
                        · {t.note}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.user.name} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {t.source === "whatsapp" && " · via WA"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatRupiah(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
