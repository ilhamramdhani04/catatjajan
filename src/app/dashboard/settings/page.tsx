import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const user = session.user as typeof session.user & {
    familyId?: string;
    role?: string;
  };

  if (!user.familyId) {
    redirect("/dashboard/setup");
  }

  const [members, cats] = await Promise.all([
    db.query.users.findMany({
      where: eq(users.familyId, user.familyId),
      columns: { id: true, name: true, waNumber: true, role: true, email: true },
    }),
    db.query.categories.findMany({
      where: eq(categories.familyId, user.familyId),
    }),
  ]);

  return (
    <SettingsClient
      isAdmin={user.role === "admin"}
      currentUserId={user.id}
      members={members}
      categories={cats}
    />
  );
}
