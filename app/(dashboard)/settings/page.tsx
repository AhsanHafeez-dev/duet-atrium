"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";

export default function GeneralSettingsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    // We could fetch user profile here if needed
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-on-surface-variant">Manage your account preferences and profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-2">Display Name</label>
                  <input type="text" className="w-full bg-surface-container-highest border border-outline/20 rounded-xl px-4 py-2.5 text-sm" placeholder="Coming soon..." disabled />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-2">Email Address</label>
                  <input type="text" className="w-full bg-surface-container-highest border border-outline/20 rounded-xl px-4 py-2.5 text-sm" placeholder="Coming soon..." disabled />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 text-error">Danger Zone</h2>
              <button disabled className="px-6 py-2 bg-error/10 text-error border border-error/20 rounded-xl font-bold opacity-50 cursor-not-allowed">
                Deactivate Account
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {role === "ADMIN" && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                  Admin Controls
                </h3>
                <p className="text-xs text-on-surface-variant mb-4 font-medium italic">
                    Administrative platform-wide settings are located in a dedicated section.
                </p>
                <Link href="/admin/settings" className="block w-full py-2 bg-primary text-on-primary text-center rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                  Go to Portal Settings
                </Link>
              </div>
            )}
            
            <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
                <h3 className="font-bold mb-4">Account Status</h3>
                <div className="flex items-center gap-2 text-sm text-success">
                  <span className="material-symbols-outlined">verified</span>
                  <span className="font-medium">Verified Account</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
