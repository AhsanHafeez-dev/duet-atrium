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

// Write API routes exempt from portal lock (auth + lock-toggle itself)
const LOCK_EXEMPT_PATHS = [
  "/api/auth",
  "/api/cron",
  "/api/admin/portal-lock",
];

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Page Refirection handled by AuthGuard component ──────
  // We no longer use server-side middleware for auth because localStorage is unreadable on the edge.

  // ── 2. Portal lock guard for all write API calls ─────────
  if (
    pathname.startsWith("/api/") &&
    WRITE_METHODS.includes(req.method) &&
    !LOCK_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    // Check portal lock status from DB via a lightweight fetch
    // We keep this as a separate fetch to avoid importing Prisma in edge middleware
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
      // If lock check fails, allow the request (fail-open)
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
