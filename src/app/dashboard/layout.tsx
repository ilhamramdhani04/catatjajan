import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import PushSetup from "@/components/push-setup";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-gray-900 text-lg">
            CatatJajan
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/transactions"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Transaksi
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Pengaturan
            </Link>
            <span className="text-sm text-gray-600">{user.name}</span>
            <form action="/api/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Push notification setup (invisible) */}
      <PushSetup />

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
