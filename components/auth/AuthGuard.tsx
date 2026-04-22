"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        router.push("/auth/login?redirect=" + pathname);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/auth/login?redirect=" + pathname);
          return;
        }

        if (!res.ok) {
           // If it's a 500 or other error, maybe don't redirect immediately to allow for retry/refresh
           console.warn("Auth check failed with status:", res.status);
           setLoading(false); // Stop loading so user sees something, but don't authorize
           return;
        }

        const data = await res.json();
        
        // Role check
        if (allowedRoles && !allowedRoles.includes(data.user.role)) {
          router.push("/dashboard"); // or some unauthorized page
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/auth/login?redirect=" + pathname);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className="text-on-surface-variant font-medium animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
