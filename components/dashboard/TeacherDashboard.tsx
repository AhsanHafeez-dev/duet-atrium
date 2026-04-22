"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     fetch("/api/teacher/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
     })
       .then(r => r.json())
       .then(res => {
          if (res.success) {
             setData(res);
          }
          setLoading(false);
       })
       .catch(err => {
          console.error(err);
          setLoading(false);
       });
  }, []);

  if (loading) {
     return <div className="text-center p-10"><span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span></div>;
  }

  const { user, pendingProposals, supervisedProposals } = data || { user: {}, pendingProposals: [], supervisedProposals: [] };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Welcome & Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative rounded-3xl overflow-hidden bg-surface-container-high border border-[#2d3449] p-8">
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-secondary/10 to-transparent pointer-events-none"></div>
           <div className="relative z-10 text-left h-full flex flex-col justify-center">
             <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
               Welcome back, <br/><span className="text-secondary">{user.email?.split('@')[0]}</span>
             </h1>
             <p className="text-on-surface-variant text-sm md:text-base max-w-sm">
               You have {pendingProposals.length} proposal review{pendingProposals.length === 1 ? '' : 's'} pending.
             </p>
           </div>
        </div>

        <div className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6 relative overflow-hidden group hover:border-[#3e495d] transition-colors">
           <div className="absolute top-4 right-4 text-tertiary">
             <span className="material-symbols-outlined text-3xl">groups</span>
           </div>
           <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Active Groups</p>
           <h2 className="text-5xl font-bold font-mono tracking-tighter">{supervisedProposals.length}</h2>
           <p className="text-xs text-outline mt-2">Supervising out of max 3</p>
        </div>

        <div className="bg-surface-container-low border border-[#2d3449] rounded-3xl p-6 relative overflow-hidden group hover:border-error-container transition-colors">
           <div className="absolute top-4 right-4 text-error">
             <span className="material-symbols-outlined text-3xl">pending_actions</span>
           </div>
           <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Reviews</p>
           <h2 className="text-5xl font-bold font-mono tracking-tighter text-error">{pendingProposals.length}</h2>
           <p className="text-xs text-error mt-2">Awaiting your approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Supervised Projects List */}
          <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">monitoring</span>
                 Supervised Projects Progress
               </h2>
               <Link href="/supervised-groups" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">View All</Link>
            </div>
            
            <div className="space-y-4">
              {supervisedProposals.length === 0 ? (
                 <p className="text-sm text-on-surface-variant">You are not supervising any groups yet.</p>
              ) : supervisedProposals.map((prop: any) => (
                <div key={prop.id} className="p-5 rounded-xl bg-surface-container-highest border border-[#3e495d]">
                   <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{prop.title}</h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-2">
                           <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">tag</span> {prop.groupId.substring(0, 8)}</span>
                           <span>•</span>
                           <span>{prop.group.members.length} Members</span>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                        Active
                      </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Action Items (Pending Proposals) */}
          <div className="bg-surface-container-low border border-error-container rounded-2xl p-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-error">assignment_late</span>
              Action Required
            </h2>
            
            <div className="space-y-4">
              {pendingProposals.length === 0 ? (
                 <p className="text-sm text-on-surface-variant">No pending proposals.</p>
              ) : pendingProposals.map((prop: any) => (
                <Link key={prop.id} href={`/proposals/${prop.id}`} className="block p-4 rounded-xl bg-surface-container-highest border border-[#3e495d] cursor-pointer hover:bg-[#31394d] transition-colors group">
                   <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{prop.title}</h3>
                   <div className="flex justify-between items-center text-xs text-on-surface-variant mt-2">
                      <span>{prop.submittedBy.email.split('@')[0]}</span>
                      <span>{new Date(prop.createdAt).toLocaleDateString()}</span>
                   </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
