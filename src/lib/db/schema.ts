import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth core tables (nama & kolom harus PERSIS — jangan diubah)
// ─────────────────────────────────────────────────────────────────────────────

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),

  // ── Extension: data keluarga ──────────────────────────────────────────────
  familyId: text("family_id").references(() => families.id, {
    onDelete: "set null",
  }),
  waNumber: text("wa_number").unique(), // format: "628xxxxxxxxxx"
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Domain Tables
// ─────────────────────────────────────────────────────────────────────────────

export const families = sqliteTable("family", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                 // "Makan", "Jajan", dll
  icon: text("icon").default("💰"),             // emoji icon opsional
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  // Budget bulanan opsional untuk fitur notifikasi overspending
  monthlyBudget: real("monthly_budget"),
});

export const transactions = sqliteTable("transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  amount: integer("amount").notNull(),           // dalam Rupiah
  note: text("note"),
  source: text("source", { enum: ["whatsapp", "web"] })
    .notNull()
    .default("web"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pushSubscriptions = sqliteTable("push_subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations (untuk query dengan drizzle relational API)
// ─────────────────────────────────────────────────────────────────────────────

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(users),
  categories: many(categories),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, { fields: [users.familyId], references: [families.id] }),
  transactions: many(transactions),
  pushSubscriptions: many(pushSubscriptions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  family: one(families, {
    fields: [transactions.familyId],
    references: [families.id],
  }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type User = typeof users.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
