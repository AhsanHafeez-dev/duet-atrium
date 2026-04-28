"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.groupId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search by title or group ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-highest border-transparent border-b focus:border-primary text-on-surface rounded-t-md pl-10 pr-4 py-2 text-sm transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-outline">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-container-highest text-on-surface text-xs font-bold rounded-lg px-4 py-2 border border-outline-variant/10 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED_BY_SUPERVISOR">Supervisor Approved</option>
              <option value="ACCEPTED">Accepted (Allotted)</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/30 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Proposal Title</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Group & Teacher</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <span className="material-symbols-outlined text-3xl animate-spin text-primary opacity-50">progress_activity</span>
                    </td>
                  </tr>
                ) : filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                         <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                         <p className="text-sm font-medium">No matching proposals found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((prop) => (
                    <tr key={prop.id} className="hover:bg-surface-container-highest/20 transition-colors group">
                      <td className="px-6 py-5 max-w-md">
                        <p className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{prop.title}</p>
                        <p className="text-[10px] text-outline mt-1 font-mono uppercase tracking-tighter opacity-60">ID: {prop.id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                             <span className="material-symbols-outlined text-[14px] text-primary">groups</span>
                             {prop.groupId}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-outline font-medium">
                             <span className="material-symbols-outlined text-[12px]">person</span>
                             {prop.teacher?.email?.split('@')[0] || "Unassigned"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.05em] border inline-flex items-center gap-1.5 ${
                          prop.status === 'ACCEPTED' ? 'bg-primary/10 text-primary border-primary/20' :
                          prop.status === 'APPROVED_BY_SUPERVISOR' ? 'bg-primary/5 text-primary border-primary/30 animate-pulse' :
                          prop.status === 'REJECTED' ? 'bg-error/10 text-error border-error/20' :
                          prop.status === 'REVISION_REQUESTED' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                          'bg-tertiary/10 text-tertiary border-tertiary/20'
                        }`}>
                           <span className={`w-1 h-1 rounded-full ${
                              prop.status === 'ACCEPTED' || prop.status === 'APPROVED_BY_SUPERVISOR' ? 'bg-primary' :
                              prop.status === 'REJECTED' ? 'bg-error' : 'bg-current'
                           }`}></span>
                           {prop.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                           {prop.status === 'APPROVED_BY_SUPERVISOR' && (
                              <button 
                                 onClick={async () => {
                                    if (!confirm("Are you sure you want to finalize this proposal allotment? This will officially assign the supervisor to the group.")) return;
                                    const token = localStorage.getItem("access_token");
                                    const res = await fetch(`/api/admin/proposals/${prop.id}/approve`, {
                                       method: "POST",
                                       headers: { "Authorization": `Bearer ${token}` }
                                    });
                                    if (res.ok) fetchProposals();
                                    else alert("Failed to approve");
                                 }}
                                 className="px-4 py-1.5 bg-primary text-on-primary text-[10px] font-black rounded-lg hover:brightness-110 transition-all shadow-sm shadow-primary/20 flex items-center gap-1"
                              >
                                 <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                 Approve Allotment
                              </button>
                           )}
                           <Link href={`/proposals/${prop.id}`} className="p-2 inline-flex items-center gap-1 text-xs font-bold text-outline hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                             <span className="material-symbols-outlined text-[18px]">visibility</span>
                             Details
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
