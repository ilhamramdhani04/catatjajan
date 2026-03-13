import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Minimal 8 karakter untuk keamanan dasar
    minPasswordLength: 8,
  },

  // Extend user schema dengan field custom kita
  user: {
    additionalFields: {
      familyId: {
        type: "string",
        required: false,
        input: false, // tidak boleh di-set langsung oleh client
      },
      waNumber: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 hari
    updateAge: 60 * 60 * 24,       // refresh setiap 1 hari
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
