"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/api/admin/stats", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setStats(res.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-20"><span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Administrative Control</h1>
        <p className="text-on-surface-variant">System oversight and configuration management.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/users?role=STUDENT" className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6 hover:border-primary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Students</p>
          <h2 className="text-4xl font-bold font-mono tracking-tighter">{stats?.studentCount || 0}</h2>
        </Link>

        <Link href="/admin/users?role=TEACHER" className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6 hover:border-tertiary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
              <span className="material-symbols-outlined text-3xl">supervisor_account</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors">arrow_forward</span>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Faculty</p>
          <h2 className="text-4xl font-bold font-mono tracking-tighter">{stats?.teacherCount || 0}</h2>
        </Link>

        <div className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-3xl">groups</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Active Groups</p>
          <h2 className="text-4xl font-bold font-mono tracking-tighter">{stats?.groupCount || 0}</h2>
        </div>

        <Link href="/admin/proposals" className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6 hover:border-error/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-error transition-colors">arrow_forward</span>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Pending Proposals</p>
          <h2 className="text-4xl font-bold font-mono tracking-tighter text-error">{stats?.pendingProposals || 0}</h2>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                System Integrity
              </h2>
              <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed mb-8">
                The portal is currently <span className={stats?.isLocked ? "text-error font-bold" : "text-success font-bold"}>{stats?.isLocked ? "LOCKED" : "OPERATIONAL"}</span>. 
                {stats?.isLocked ? " All user submissions and group modifications are paused." : " All students and teachers have full access to their respective features."}
              </p>
              <Link href="/admin/settings" className="px-6 py-2.5 bg-surface-container-highest border border-outline/20 rounded-xl font-bold hover:bg-surface-bright transition-colors inline-block">
                Configure Portal Status
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Audit Logs
          </h2>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-container-highest border border-[#3e495d] text-xs">
               <p className="font-bold text-on-surface mb-1 text-[11px]">ADMIN_SEED Successful</p>
               <p className="text-outline">System initialization completed.</p>
               <p className="text-[10px] text-primary mt-2">Just now</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-highest/50 border border-[#3e495d]/50 text-xs text-outline italic text-center">
               End of activity log.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
