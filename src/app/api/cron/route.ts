import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { families, users, transactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendTextMessage, replyTemplates } from "@/lib/whatsapp";
import { sendPushToFamily } from "@/lib/push";

/**
 * GET /api/cron?action=weekly-report|budget-alert
 *
 * Dipanggil oleh Vercel Cron Jobs atau cURL eksternal.
 * Dilindungi oleh header Authorization: Bearer <CRON_SECRET>
 *
 * Setup di vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron?action=weekly-report", "schedule": "0 8 * * 1" },
 *     { "path": "/api/cron?action=budget-alert",  "schedule": "0 20 * * *" }
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
  // Verifikasi secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action") ?? "weekly-report";

  try {
    if (action === "weekly-report") {
      const result = await runWeeklyReport();
      return NextResponse.json(result);
    }

    if (action === "budget-alert") {
      const result = await runBudgetAlert();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Action "${action}" tidak dikenal.` }, { status: 400 });
  } catch (err) {
    console.error("[Cron] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Aksi 1: Rekap Mingguan
// Dikirim setiap Senin pagi ke semua anggota yang punya nomor WA.
// ─────────────────────────────────────────────────────────────────────────────

async function runWeeklyReport() {
  const now = new Date();
  // Rentang minggu kemarin (Senin–Minggu)
  const endOfLastWeek = new Date(now);
  endOfLastWeek.setDate(now.getDate() - now.getDay()); // hari Minggu kemarin
  endOfLastWeek.setHours(23, 59, 59, 999);

  const startOfLastWeek = new Date(endOfLastWeek);
  startOfLastWeek.setDate(endOfLastWeek.getDate() - 6); // Senin kemarin
  startOfLastWeek.setHours(0, 0, 0, 0);

  const allFamilies = await db.query.families.findMany();
  const stats = { familiesProcessed: 0, messagesSent: 0, errors: 0 };

  for (const family of allFamilies) {
    try {
      const weeklyTxs = await db.query.transactions.findMany({
        where: and(
          eq(transactions.familyId, family.id),
          gte(transactions.createdAt, startOfLastWeek),
          lte(transactions.createdAt, endOfLastWeek)
        ),
        with: { category: { columns: { name: true } } },
      });

      if (weeklyTxs.length === 0) {
        stats.familiesProcessed++;
        continue; // Tidak ada transaksi — skip keluarga ini
      }

      // Agregasi per kategori
      const breakdown = Object.values(
        weeklyTxs.reduce(
          (acc, t) => {
            const catName = t.category.name;
            if (!acc[catName]) acc[catName] = { category: catName, amount: 0 };
            acc[catName].amount += t.amount;
            return acc;
          },
          {} as Record<string, { category: string; amount: number }>
        )
      ).sort((a, b) => b.amount - a.amount);

      const total = weeklyTxs.reduce((s, t) => s + t.amount, 0);
      const message = replyTemplates.weeklyReport(family.name, total, breakdown);

      // Kirim ke semua anggota yang punya nomor WA
      const members = await db.query.users.findMany({
        where: eq(users.familyId, family.id),
        columns: { waNumber: true },
      });

      for (const member of members) {
        if (!member.waNumber) continue;
        try {
          await sendTextMessage({ to: member.waNumber, text: message });
          stats.messagesSent++;
        } catch (err) {
          console.error(
            `[Cron/weekly] Gagal kirim ke ${member.waNumber}:`,
            err
          );
          stats.errors++;
        }
      }

      // Kirim push notification ke semua anggota
      const topCategories = breakdown
        .slice(0, 2)
        .map((b) => `${b.category}: Rp${b.amount.toLocaleString("id-ID")}`)
        .join(" | ");

      await sendPushToFamily(family.id, {
        title: `Rekap Mingguan ${family.name}`,
        body: `Total: Rp${total.toLocaleString("id-ID")} — ${topCategories}`,
        url: "/dashboard",
        tag: `weekly-${family.id}`,
      }).catch((err) =>
        console.error(`[Cron/weekly] Push error family ${family.id}:`, err)
      );

      stats.familiesProcessed++;
    } catch (err) {
      console.error(`[Cron/weekly] Error family ${family.id}:`, err);
      stats.errors++;
    }
  }

  return { action: "weekly-report", ...stats };
}

// ─────────────────────────────────────────────────────────────────────────────
// Aksi 2: Peringatan Budget
// Dikirim setiap malam — cek semua kategori yang punya monthlyBudget.
// Kirim peringatan jika pengeluaran bulan ini >= 80% dari budget.
// ─────────────────────────────────────────────────────────────────────────────

async function runBudgetAlert() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Ambil semua kategori yang punya budget
  const budgetedCategories = await db.query.categories.findMany({
    where: (cat, { isNotNull }) => isNotNull(cat.monthlyBudget),
    with: { family: { with: { members: { columns: { waNumber: true } } } } },
  });

  const stats = { categoriesChecked: 0, alertsSent: 0, errors: 0 };

  for (const category of budgetedCategories) {
    if (!category.monthlyBudget) continue;

    try {
      const monthlyTxs = await db.query.transactions.findMany({
        where: and(
          eq(transactions.familyId, category.familyId),
          eq(transactions.categoryId, category.id),
          gte(transactions.createdAt, startOfMonth)
        ),
        columns: { amount: true },
      });

      const totalSpent = monthlyTxs.reduce((s, t) => s + t.amount, 0);
      const percentage = totalSpent / category.monthlyBudget;

      stats.categoriesChecked++;

      // Alert di 80% dan 100%
      if (percentage < 0.8) continue;

      const alertText = replyTemplates.budgetWarning(
        category.name,
        totalSpent,
        category.monthlyBudget
      );

      const members = category.family.members;

      for (const member of members) {
        if (!member.waNumber) continue;
        try {
          await sendTextMessage({ to: member.waNumber, text: alertText });
          stats.alertsSent++;
        } catch (err) {
          console.error(
            `[Cron/budget] Gagal kirim ke ${member.waNumber}:`,
            err
          );
          stats.errors++;
        }
      }
      // Kirim push notification ke semua anggota keluarga
      await sendPushToFamily(category.familyId, {
        title: `Peringatan Budget ${category.name}`,
        body: `Terpakai Rp${totalSpent.toLocaleString("id-ID")} dari Rp${category.monthlyBudget.toLocaleString("id-ID")} (${Math.round(percentage * 100)}%)`,
        url: "/dashboard/settings",
        tag: `budget-${category.id}`,
      }).catch((err) =>
        console.error(`[Cron/budget] Push error category ${category.id}:`, err)
      );
    } catch (err) {
      console.error(`[Cron/budget] Error category ${category.id}:`, err);
      stats.errors++;
    }
  }

  return { action: "budget-alert", ...stats };
}
