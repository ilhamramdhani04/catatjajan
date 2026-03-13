import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import TransactionsClient from "./transactions-client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const user = session.user as typeof session.user & { familyId?: string };

  if (!user.familyId) {
    redirect("/dashboard/setup");
  }

  const { period = "monthly" } = await searchParams;

  const now = new Date();
  let from: Date;

  if (period === "weekly") {
    from = new Date(now);
    from.setDate(now.getDate() - now.getDay());
    from.setHours(0, 0, 0, 0);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [txs, cats] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        eq(transactions.familyId, user.familyId),
        gte(transactions.createdAt, from)
      ),
      with: {
        category: { columns: { name: true, icon: true } },
        user: { columns: { name: true } },
      },
      orderBy: [desc(transactions.createdAt)],
    }),
    db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
    }),
  ]);

  const total = txs.reduce((s, t) => s + t.amount, 0);

  return (
    <TransactionsClient
      transactions={txs}
      categories={cats}
      total={total}
      period={period}
    />
  );
}
