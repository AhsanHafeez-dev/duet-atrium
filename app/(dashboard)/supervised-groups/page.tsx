"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";

export default function SupervisedGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/api/teacher/groups", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setGroups(res.groups);
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
        <div>
          <h1 className="text-3xl font-bold">Supervised Groups</h1>
          <p className="text-on-surface-variant">View and manage groups you are currently supervising.</p>
        </div>

        {loading ? (
          <div className="text-center p-10"><span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.length === 0 ? (
              <div className="col-span-full p-20 bg-surface-container-low border border-dashed border-[#2d3449] rounded-3xl text-center">
                 <span className="material-symbols-outlined text-5xl text-outline mb-4">group</span>
                 <p className="text-on-surface-variant font-medium">You are not supervising any groups yet.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="bg-surface-container-low border border-[#2d3449] rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[#2d3449]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Group: {group.id.substring(0, 12)}</h2>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                           <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{group.status}</span>
                           <span>•</span>
                           <span>{group.members.length} Members</span>
                        </div>
                      </div>
                      <Link href={`/proposals/${group.proposals?.[0]?.id}`} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined">launch</span>
                      </Link>
                    </div>
                    <p className="text-sm font-semibold text-primary mb-2 line-clamp-1">{group.proposals?.[0]?.title}</p>
                  </div>
                  
                  <div className="p-6 bg-surface-container-low/50 flex-1">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Participants</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.members.map((m: any) => (
                        <div key={m.studentId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-highest border border-[#3e495d]">
                          <div className="w-8 h-8 rounded-full bg-surface border border-[#424754] flex items-center justify-center text-xs font-bold text-primary">
                            {m.student.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-sm truncate">{m.student.email.split('@')[0]}</p>
                            <p className="text-[10px] text-on-surface-variant">{m.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-surface-container border-t border-[#2d3449] flex justify-end gap-3">
                    <button className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Contact Group</button>
                    <button className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-all">Submit Feedback</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
