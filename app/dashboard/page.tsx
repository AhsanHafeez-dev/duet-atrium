"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    setRole(userRole);
  }, []);

  return (
    <AuthGuard>
      {role === "STUDENT" && <StudentDashboard />}
      {role === "TEACHER" && <TeacherDashboard />}
      {role === "ADMIN" && <AdminDashboard />}
    </AuthGuard>
  );
}
