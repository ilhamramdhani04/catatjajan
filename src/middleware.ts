import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/api/webhook"];

// Better Auth menggunakan cookie ini untuk menyimpan session token.
// Middleware hanya cek keberadaan cookie (Edge Runtime compatible).
// Verifikasi penuh dilakukan di masing-masing Server Component/API Route.
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name)
  );

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
