"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      // For now, let's use the standard proposals API but we might need an admin version if we want EVERYTHING
      // Actually, let's create a dedicated admin API for this if needed, but let's try the general one first or create it.
      const res = await fetch(`/api/proposals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Proposals Oversight</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review all project proposals submitted across the platform.</p>
        </div>

        <div className="bg-surface-container-low border border-[#222a3d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/50 border-b border-[#222a3d]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Proposal Title</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Group & Teacher</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
                    </td>
                  </tr>
                ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant">No proposals found in the system.</td>
                  </tr>
                ) : (
                  proposals.map((prop) => (
                    <tr key={prop.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-sm font-bold text-on-surface line-clamp-1">{prop.title}</p>
                        <p className="text-[10px] text-outline mt-1">ID: {prop.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-on-surface">Group: {prop.groupId}</p>
                          <p className="text-[10px] text-outline">Teacher: {prop.teacher?.email?.split('@')[0] || "Unassigned"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          prop.status === 'ACCEPTED' ? 'bg-success/10 text-success border border-success/20' :
                          prop.status === 'APPROVED_BY_SUPERVISOR' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' :
                          prop.status === 'REJECTED' ? 'bg-error/10 text-error border border-error/20' :
                          'bg-secondary/10 text-secondary border border-secondary/20'
                        }`}>
                          {prop.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {prop.status === 'APPROVED_BY_SUPERVISOR' && (
                              <button 
                                 onClick={async () => {
                                    if (!confirm("Are you sure you want to finalize this proposal allotment?")) return;
                                    const token = localStorage.getItem("access_token");
                                    const res = await fetch(`/api/admin/proposals/${prop.id}/approve`, {
                                       method: "POST",
                                       headers: { "Authorization": `Bearer ${token}` }
                                    });
                                    if (res.ok) fetchProposals();
                                    else alert("Failed to approve");
                                 }}
                                 className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold rounded hover:bg-primary-container transition-colors"
                              >
                                 Final Approve
                              </button>
                           )}
                           <Link href={`/proposals/${prop.id}`} className="p-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-all">
                             View
                           </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
