"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{ color: "var(--red)", border: "1px solid rgba(224,96,96,0.2)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(224,96,96,0.08)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      Keluar
    </button>
  );
}
