import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import DashboardClient from "./dashboard-client";

interface CategorySummary {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
}

export default async function DashboardPage() {
  const rawSession = await auth.api.getSession({ headers: await headers() });
  if (!rawSession) redirect("/login");
  const user = rawSession.user as typeof rawSession.user & { familyId?: string };

  if (!user.familyId) {
    return <NeedFamilySetup />;
  }

  // Data minggu ini
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weeklyTxs, monthlyTxs, allCategories] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        eq(transactions.familyId, user.familyId),
        gte(transactions.createdAt, startOfWeek)
      ),
      with: { category: true, user: { columns: { name: true } } },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.transactions.findMany({
      where: and(
        eq(transactions.familyId, user.familyId),
        gte(transactions.createdAt, startOfMonth)
      ),
      with: { category: true },
    }),
    db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
    }),
  ]);

  const weeklyTotal = weeklyTxs.reduce((s, t) => s + t.amount, 0);
  const monthlyTotal = monthlyTxs.reduce((s, t) => s + t.amount, 0);

  // Agregasi per kategori untuk pie chart (bulan ini)
  const pieData: CategorySummary[] = Object.values(
    monthlyTxs.reduce(
      (acc, t) => {
        const catId = t.categoryId;
        if (!acc[catId]) {
          acc[catId] = {
            categoryId: catId,
            name: t.category.name,
            icon: t.category.icon ?? "ð°",
            total: 0,
          };
        }
        acc[catId].total += t.amount;
        return acc;
      },
      {} as Record<string, CategorySummary>
    )
  ).sort((a, b) => b.total - a.total);

  return (
    <DashboardClient
      weeklyTotal={weeklyTotal}
      monthlyTotal={monthlyTotal}
      pieData={pieData}
      recentTransactions={weeklyTxs.slice(0, 10)}
      categories={allCategories}
    />
  );
}

function NeedFamilySetup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center anim-fade-up">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(212,180,131,0.1)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
        â
      </div>
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--cream)", letterSpacing: "-0.02em" }}>
          Belum ada grup keluarga
        </h2>
        <p className="text-sm mt-2 max-w-xs" style={{ color: "var(--cream-dim)" }}>
          Buat grup keluarga atau minta admin untuk menambahkanmu.
        </p>
      </div>
      <a
        href="/dashboard/setup"
        className="btn-gold"
        style={{ width: "auto", padding: "10px 24px" }}
      >
        Buat Grup Keluarga
      </a>
    </div>
  );
}
