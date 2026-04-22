"use client";

import AuthGuard from "@/components/auth/AuthGuard";

export default function AnnouncementsPage() {
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-on-surface-variant">Stay updated with the latest FYP news and deadlines.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-container-low border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-primary/20 text-primary text-[10px] font-bold rounded-bl-xl">NEW</div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-1">Proposal Submission Deadline Extended</h2>
                <p className="text-sm text-on-surface-variant mb-4">The deadline for submitting initial project proposals has been extended to April 30th, 2026. Please ensure all members have accepted invitations before submitting.</p>
                <div className="flex items-center gap-3 text-xs text-outline font-medium">
                  <span>Posted 2 hours ago</span>
                  <span>•</span>
                  <span>By: FYP Coordinator</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-[#222a3d] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-1">FYP Handbook 2026 Updated</h2>
                <p className="text-sm text-on-surface-variant mb-4">The updated FYP handbook containing detailed guidelines on documentation and implementation is now available in the Documents section.</p>
                <div className="flex items-center gap-3 text-xs text-outline font-medium">
                  <span>Posted 1 day ago</span>
                  <span>•</span>
                  <span>By: Admin</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-10 border border-dashed border-[#222a3d] rounded-2xl text-center">
            <p className="text-sm text-on-surface-variant">No more older announcements.</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
