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
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50"
        style={{ background: "rgba(8,7,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--gold-border)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "rgba(212,180,131,0.1)", border: "1px solid var(--gold-border)" }}>
              <span style={{ color: "var(--gold)" }}>◈</span>
            </div>
            <span className="font-semibold text-sm tracking-wide" style={{ color: "var(--cream)" }}>CatatJajan</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/dashboard/transactions", label: "Transaksi" },
              { href: "/dashboard/settings", label: "Pengaturan" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="nav-link px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(212,180,131,0.12)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs" style={{ color: "var(--cream-dim)" }}>{user.name}</span>
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
