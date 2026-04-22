"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    setRole(userRole);
    
    const token = localStorage.getItem("access_token");
    fetch("/api/proposals", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setProposals(res.proposals);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-on-surface-variant">Manage and track project proposals.</p>
          </div>
          {role === "STUDENT" && (
            <Link href="/proposals/new" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New Proposal
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center p-10"><span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.length === 0 ? (
              <div className="col-span-full p-20 bg-surface-container-low border border-dashed border-[#2d3449] rounded-3xl text-center">
                 <span className="material-symbols-outlined text-5xl text-outline mb-4">description</span>
                 <p className="text-on-surface-variant font-medium">No proposals found.</p>
              </div>
            ) : (
              proposals.map((prop) => (
                <Link key={prop.id} href={`/proposals/${prop.id}`} className="group relative bg-surface-container-low border border-[#2d3449] rounded-2xl p-6 hover:border-primary/50 transition-all hover:translate-y-[-4px]">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      prop.status === 'ACCEPTED' ? 'bg-primary/10 text-primary border border-primary/20' :
                      prop.status === 'PENDING' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' :
                      prop.status === 'REVISION_REQUESTED' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                      'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {prop.status.replace("_", " ")}
                    </span>

                    <span className="text-[10px] text-on-surface-variant font-mono">{new Date(prop.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{prop.title}</h3>
                  <div className="mt-4 pt-4 border-t border-[#2d3449] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                        {role === "STUDENT" ? prop.teacher?.email?.[0]?.toUpperCase() : prop.submittedBy?.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-on-surface-variant truncate max-w-[120px]">
                        {role === "STUDENT" ? prop.teacher?.email?.split('@')[0] : prop.submittedBy?.email?.split('@')[0]}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
