"use client";

import SideNavBar from "@/components/layout/SideNavBar";
import TopNavBar from "@/components/layout/TopNavBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [role, setRole] = useState<string>("STUDENT");

  useEffect(() => {
     // Fetch role from localStorage or API
     const storedRole = localStorage.getItem("user_role");
     if (storedRole) setRole(storedRole);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <SideNavBar role={role} />
        <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 relative h-screen">
          <TopNavBar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24 md:pb-6 relative z-10 scroll-smooth">
            {children}
          </main>
          <BottomNavBar role={role} />
        </div>
      </div>
    </AuthGuard>
  );
}
