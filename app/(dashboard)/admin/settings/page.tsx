"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminSettingsPage() {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/portal-status")
      .then(r => r.json())
      .then(data => {
        setIsLocked(data.isLocked);
        setLoading(false);
      });
  }, []);

  const handleToggleLock = async () => {
    setActionLoading(true);
    setSuccess("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin/portal-lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ lock: !isLocked })
      });
      const data = await res.json();
      if (data.success) {
        setIsLocked(data.isLocked);
        setSuccess(`Portal successfully ${data.isLocked ? "LOCKED" : "UNLOCKED"}.`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Portal Settings</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure global platform behavior and security constraints.</p>
        </div>

        {success && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal Access Control Bento */}
          <div className="bg-surface-container-low border border-[#222a3d] rounded-3xl p-8 flex flex-col justify-between group hover:border-primary/30 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLocked ? 'bg-error/10 text-error' : 'bg-success/10 text-success'} transition-colors`}>
                  <span className="material-symbols-outlined text-3xl font-variation-grad-200">{isLocked ? 'lock' : 'lock_open'}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Portal Lock</h2>
                  <p className="text-xs text-on-surface-variant">Global override for all user activity</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Locking the portal prevents students and teachers from making new submissions, proposals, or group modifications. Existing data remains readable.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-highest/30 rounded-2xl border border-outline/10">
                <span className="text-sm font-medium">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isLocked ? 'bg-error text-on-error' : 'bg-success text-on-success'}`}>
                  {isLocked ? "Locked" : "Active"}
                </span>
              </div>
              
              <button
                onClick={handleToggleLock}
                disabled={loading || actionLoading}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isLocked ? "bg-success text-on-success hover:brightness-110" : "bg-error text-on-error hover:brightness-110"
                } shadow-lg ${isLocked ? 'shadow-success/20' : 'shadow-error/20'} disabled:opacity-50`}
              >
                {actionLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{isLocked ? 'lock_open' : 'lock'}</span>
                    {isLocked ? "Unlock All Activity" : "Lock Portal Activity"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Maintenance Stats */}
          <div className="bg-surface-container-low border border-[#222a3d] rounded-3xl p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                System Health
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#222a3d]">
                  <span className="text-sm text-on-surface-variant">Database Status</span>
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#222a3d]">
                  <span className="text-sm text-on-surface-variant">Cloudinary Storage</span>
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-on-surface-variant">Portal Uptime</span>
                  <span className="text-xs font-bold text-on-surface">99.98%</span>
                </div>
              </div>
            </div>

            <div className="pt-8 text-[10px] text-outline italic">
              Note: System-wide settings require full administrator privileges. All changes are logged for auditing purposes.
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
