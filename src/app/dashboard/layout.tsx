import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import PushSetup from "@/components/push-setup";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const user = session.user;

  return (
    <div className="min-h-screen mesh-bg">
      {/* Navbar */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(7,7,17,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-4 h-15 flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center text-sm shadow-glow transition-transform group-hover:scale-110">
              💰
            </div>
            <span className="font-bold gradient-text text-lg">CatatJajan</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/transactions"
              className="px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
            >
              Transaksi
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
            >
              Pengaturan
            </Link>
          </nav>

          {/* User info + signout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/60">{user.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <PushSetup />

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
