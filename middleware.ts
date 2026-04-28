import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/groups",
  "/faculty",
  "/proposals",
  "/documents",
  "/admin",
  "/onboarding",
];

// Write API routes exempt from portal lock
const LOCK_EXEMPT_PATHS = [
  "/api/auth",
  "/api/cron",
  "/api/admin/portal-lock",
  "/api/portal-status",
];

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Auth guard for protected page routes ──────────────
  // Disabling cookie-based auth check to allow localStorage-based auth handled by client-side AuthGuard
  /*
  const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtectedPage) {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
    } catch {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  */

  // ── 2. Portal lock guard for write API calls ─────────
  if (
    pathname.startsWith("/api/") &&
    WRITE_METHODS.includes(req.method) &&
    !LOCK_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const lockCheckUrl = new URL("/api/portal-status", req.url);
    try {
      const lockRes = await fetch(lockCheckUrl.toString(), {
        headers: { "x-internal": "1" },
        cache: "no-store",
      });
      if (lockRes.ok) {
        const { isLocked } = await lockRes.json();
        if (isLocked) {
          return NextResponse.json(
            {
              error:
                "Portal is locked. All changes are disabled. Contact an administrator.",
            },
            { status: 423 }
          );
        }
      }
    } catch {
      // fail-open if lock check fails
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)",],
};
