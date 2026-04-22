"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

export default function GroupsPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        {role === "STUDENT" ? (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">My Group</h1>
              <p className="text-on-surface-variant">View your current group membership and status.</p>
            </div>
            {/* Reuse the group logic from StudentDashboard but stripped down or just the component if it handles it */}
            <StudentDashboard />
          </div>
        ) : (
          <div className="p-10 text-center">
            <h1 className="text-2xl font-bold">Group Management</h1>
            <p className="mt-4 text-on-surface-variant">Group listing for faculty and admins is coming soon.</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
