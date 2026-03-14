import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, categories, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  parseTransactionMessage,
  fuzzyMatchCategory,
  getSuggestions,
} from "@/lib/parser";
import {
  sendTextMessage,
  markAsRead,
  replyTemplates,
} from "@/lib/whatsapp";

// ── Tipe dasar payload webhook Meta ──────────────────────────────────────────
interface WAWebhookBody {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}

// ── GET: verifikasi webhook dari Meta Developer Console ───────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WA_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ── POST: menerima pesan masuk dari pengguna ──────────────────────────────────
export async function POST(req: NextRequest) {
  let body: WAWebhookBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await processMessages(body);

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

async function processMessages(body: WAWebhookBody) {
  if (body.object !== "whatsapp_business_account") return;

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const messages = change.value.messages ?? [];

      for (const message of messages) {
        if (message.type !== "text" || !message.text) continue;

        const from = message.from; // contoh: "628123456789"
        const text = message.text.body.trim();

        try {
          await markAsRead(message.id);
          await handleTextMessage(from, text);
        } catch (err) {
          console.error(`[Webhook] Error processing message from ${from}:`, err);
        }
      }
    }
  }
}

async function handleTextMessage(waNumber: string, text: string) {
  // 1. Cari user berdasarkan nomor WA
  const user = await db.query.users.findFirst({
    where: eq(users.waNumber, waNumber),
  });

  if (!user || !user.familyId) {
    await sendTextMessage({ to: waNumber, text: replyTemplates.notRegistered() });
    return;
  }

  const lowerText = text.toLowerCase().trim();

  // 2. Tangani perintah khusus
  if (lowerText === "bantuan" || lowerText === "help" || lowerText === "?") {
    const cats = await db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
    });
    await sendTextMessage({
      to: waNumber,
      text: replyTemplates.help(cats.map((c) => c.name)),
    });
    return;
  }

  if (lowerText === "laporan") {
    // Placeholder — akan diimplementasi di Epic 7
    await sendTextMessage({ to: waNumber, text: "Fitur laporan segera hadir." });
    return;
  }

  // 3. Parse pesan sebagai transaksi
  const result = parseTransactionMessage(text);

  if (!result.ok) {
    await sendTextMessage({ to: waNumber, text: replyTemplates.parseError() });
    return;
  }

  const { categoryRaw, amount, note } = result.data;

  // 4. Cocokkan kategori
  const familyCategories = await db.query.categories.findMany({
    where: eq(categories.familyId, user.familyId),
  });

  const catNames = familyCategories.map((c) => c.name);
  const matched = fuzzyMatchCategory(categoryRaw, catNames);

  if (!matched) {
    const suggestions = getSuggestions(categoryRaw, catNames);
    await sendTextMessage({
      to: waNumber,
      text:
        suggestions.length > 0
          ? replyTemplates.unknownCategory(categoryRaw, suggestions)
          : replyTemplates.parseError(),
    });
    return;
  }

  const category = familyCategories.find(
    (c) => c.name.toLowerCase() === matched.match.toLowerCase()
  )!;

  // 5. Simpan transaksi
  await db.insert(transactions).values({
    familyId: user.familyId,
    userId: user.id,
    categoryId: category.id,
    amount,
    note,
    source: "whatsapp",
  });

  // 6. Kirim konfirmasi
  await sendTextMessage({
    to: waNumber,
    text: replyTemplates.success(category.name, amount, note),
  });

  // 7. Cek budget warning jika kategori punya budget
  if (category.monthlyBudget) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await db.query.transactions.findMany({
      where: (t, { and, eq: eqFn, gte }) =>
        and(
          eqFn(t.familyId, user.familyId!),
          eqFn(t.categoryId, category.id),
          gte(t.createdAt, startOfMonth)
        ),
    });

    const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalSpent >= category.monthlyBudget * 0.9) {
      await sendTextMessage({
        to: waNumber,
        text: replyTemplates.budgetWarning(
          category.name,
          totalSpent,
          category.monthlyBudget
        ),
      });
    }
  }
}
