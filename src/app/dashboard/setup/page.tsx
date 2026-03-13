import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SetupClient from "./setup-client";

export default async function SetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const user = session.user as typeof session.user & { familyId?: string };

  // Kalau sudah ada keluarga, langsung ke dashboard
  if (user.familyId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <SetupClient userName={user.name} />
    </div>
  );
}
