"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [pendingInvitation, setPendingInvitation] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<"PENDING" | "ACCEPTED" | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshGroup = async (token: string) => {
    const res = await fetch("/api/groups", {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
    if (res.success) {
      setGroup(res.group);
      setPendingInvitation(res.pendingInvitation);
      setUserStatus(res.userStatus);
      setUserRole(res.userRole || null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const headers = { "Authorization": `Bearer ${token}` };

    Promise.all([
       fetch("/api/auth/me", { headers }).then(r => r.json()),
       fetch("/api/groups", { headers }).then(r => r.json())
    ]).then(([meData, groupData]) => {
       if (meData.user) setUser(meData.user);
       if (groupData.success) {
          setGroup(groupData.group);
          setPendingInvitation(groupData.pendingInvitation);
          setUserStatus(groupData.userStatus);
          setUserRole(groupData.userRole || null);
       }
       setLoading(false);
    }).catch(err => {
       console.error(err);
       setLoading(false);
    });
  }, []);

  const handleCreateGroup = async () => {
     setActionLoading(true);
     setError("");
     try {
        const token = localStorage.getItem("access_token")!;
        const res = await fetch("/api/groups", {
           method: "POST",
           headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
           await refreshGroup(token);
           setSuccess("Group created successfully.");
           setTimeout(() => setSuccess(""), 3000);
        } else {
           setError(data.error || "Failed to create group.");
        }
     } catch (e) {
        setError("Network Error");
     } finally {
        setActionLoading(false);
     }
  };

  const handleInvite = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!inviteEmail) return;
     setActionLoading(true);
     setError("");
     try {
        const token = localStorage.getItem("access_token")!;
        const res = await fetch("/api/groups/invite", {
           method: "POST",
           headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({ email: inviteEmail })
        });
        const data = await res.json();
        if (res.ok) {
           await refreshGroup(token);
           setSuccess("Invitation sent successfully.");
           setInviteEmail("");
           setTimeout(() => setSuccess(""), 3000);
        } else {
           setError(data.error || "Failed to invite member.");
        }
     } catch (e) {
        setError("Network Error");
     } finally {
        setActionLoading(false);
     }
  };

  const handleInvitationAction = async (action: "accept" | "reject", inviteId: string) => {
     setActionLoading(true);
     setError("");
     try {
        const token = localStorage.getItem("access_token")!;
        const res = await fetch(`/api/groups/invites/${inviteId}/${action}`, {
           method: "POST",
           headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
           await refreshGroup(token);
           setSuccess(`Invitation ${action}ed successfully.`);
           setTimeout(() => setSuccess(""), 3000);
        } else {
           setError(data.error || `Failed to ${action} invitation.`);
        }
     } catch (e) {
        setError("Network Error");
     } finally {
        setActionLoading(false);
     }
  };

  if (loading) {
     return <div className="text-center p-10"><span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span></div>;
  }

  // Role-based access control
  const isLeader = userRole === "LEADER";
  const canManageGroup = isLeader; // Only LEADER can invite members, find supervisor, draft proposals

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Welcome */}
      <div className="relative rounded-3xl overflow-hidden bg-surface-container-high border border-[#2d3449] p-8 md:p-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-tertiary/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl text-left">
          <div className="flex items-center gap-3 mb-4">
             {group && userStatus === "ACCEPTED" ? (
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 uppercase tracking-widest">
                   Phase 2: Proposal Drafting
                </span>
             ) : (
                <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs font-semibold rounded-full border border-[#3e495d] uppercase tracking-widest">
                   Phase 1: Group Formation
                </span>
             )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-on-surface mb-4 leading-tight">
            Welcome back, <span className="text-primary">{user?.email?.split('@')[0] || "Student"}</span>.
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg mb-8 leading-relaxed">
            {group && userStatus === "ACCEPTED"
              ? canManageGroup
                ? "Browse the faculty directory to find a supervisor and submit your project proposal."
                : `You are a member of ${group.id}. The group leader manages proposals and invitations.`
              : "You do not have a group yet. Create one or wait for an invitation."}
          </p>

          <div className="flex flex-wrap gap-4">
             {group && userStatus === "ACCEPTED" ? (
                <>
                   {canManageGroup && (
                     <Link href="/faculty" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 text-sm md:text-base border border-primary/50">
                       <span className="material-symbols-outlined">person_search</span>
                       Find Supervisor
                     </Link>
                   )}
                   {canManageGroup && (
                     <Link href="/proposals/new" className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-[#3e495d] transition-colors border border-[#424754] flex items-center gap-2 text-sm md:text-base">
                       <span className="material-symbols-outlined">edit_document</span>
                       Draft Proposal
                     </Link>
                   )}
                   {!canManageGroup && (
                     <div className="px-5 py-3 bg-surface-container-highest/50 text-on-surface-variant border border-outline/20 rounded-xl flex items-center gap-2 text-sm">
                       <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
                       Only the group leader can manage proposals &amp; invitations
                     </div>
                   )}
                </>
             ) : !group && !pendingInvitation ? (
                  <button onClick={handleCreateGroup} disabled={actionLoading} className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 text-sm md:text-base border border-primary/50 disabled:opacity-50">
                     <span className="material-symbols-outlined">group_add</span>
                     Create New Group
                  </button>
             ) : pendingInvitation ? (
                <div className="bg-primary/20 p-5 rounded-2xl border border-primary/30 w-full animate-in fade-in slide-in-from-left-4 duration-500">
                   <p className="text-on-surface font-semibold mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">mail</span>
                      You have an invitation to join Group {pendingInvitation.group.id}
                   </p>
                   <p className="text-xs text-on-surface-variant mb-4 -mt-2">Invite sent by {pendingInvitation.group.leader.email.split('@')[0]}</p>
                   <div className="flex gap-3">
                      <button
                         onClick={() => handleInvitationAction("accept", pendingInvitation.id)}
                         disabled={actionLoading}
                         className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all text-sm"
                      >
                         Accept Invitation
                      </button>
                      <button
                         onClick={() => handleInvitationAction("reject", pendingInvitation.id)}
                         disabled={actionLoading}
                         className="px-6 py-2 bg-transparent border border-error text-error rounded-lg font-bold hover:bg-error/10 disabled:opacity-50 transition-all text-sm"
                      >
                         Reject
                      </button>
                   </div>
                </div>
             ) : (
                <div className="bg-surface-container-highest p-5 rounded-2xl border border-outline/20">
                   <p className="text-on-surface-variant italic text-sm">Waiting for group approval...</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {(error || success) && (
         <div className={`p-4 rounded-xl text-sm font-semibold border animate-in slide-in-from-top-2 duration-300 ${error ? 'bg-error-container text-on-error-container border-error-container/50' : 'bg-primary/20 text-primary border-primary/30'}`}>
            {error || success}
         </div>
      )}

      {group && userStatus === "ACCEPTED" && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
             {/* Group Status Card */}
             <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6 relative overflow-hidden">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#2d3449] pb-6">
                 <div>
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">group</span>
                     {group.id}
                   </h2>
                   <div className="flex items-center gap-3 mt-2 text-sm text-on-surface-variant">
                     <span className="flex items-center gap-1">
                       <span className="material-symbols-outlined text-[16px]">school</span>
                       {user?.program || "BS"}
                     </span>
                     <span className="w-1 h-1 rounded-full bg-[#424754]"></span>
                     <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Status: {group.status}
                     </span>
                     {userRole && (
                       <>
                         <span className="w-1 h-1 rounded-full bg-[#424754]"></span>
                         <span className={`flex items-center gap-1 font-semibold ${isLeader ? "text-primary" : "text-on-surface-variant"}`}>
                           <span className="material-symbols-outlined text-[16px]">{isLeader ? "star" : "person"}</span>
                           Your role: {userRole}
                         </span>
                       </>
                     )}
                   </div>
                 </div>
                 <div className="bg-tertiary-container/30 text-tertiary px-4 py-2 border border-tertiary/20 rounded-xl max-w-[150px]">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1">Supervisor</p>
                    <p className="font-bold text-sm truncate">Not Assigned</p>
                 </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Members ({group.members.length}/{group.maxSize})</h3>
                     {group.invitations?.length > 0 && (
                        <span className="text-xs text-secondary italic">({group.invitations.length} Pending Invites)</span>
                     )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     {group.members.map((m: any, i: number) => (
                       <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-highest border border-[#3e495d] relative">
                           {m.studentId === user.id && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" title="You"></span>}
                           <div className="w-10 h-10 rounded-full bg-surface border border-[#424754] flex items-center justify-center font-bold text-primary">
                              {m.student.email.charAt(0).toUpperCase()}
                           </div>
                           <div className="truncate pr-4">
                              <p className="font-semibold text-sm truncate">{m.student.email.split('@')[0]}</p>
                              <p className="text-xs text-on-surface-variant">{m.role}</p>
                           </div>
                       </div>
                     ))}

                     {/* Pending Invitations */}
                     {group.invitations?.map((inv: any, i: number) => (
                       <div key={'inv-'+i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-dashed border-[#3e495d] opacity-50">
                           <div className="w-10 h-10 rounded-full border border-dashed border-[#424754] flex items-center justify-center font-bold text-outline">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                           </div>
                           <div className="truncate">
                              <p className="font-semibold text-sm truncate">{inv.invitee.email.split('@')[0]}</p>
                              <p className="text-xs text-on-surface-variant">Pending...</p>
                           </div>
                       </div>
                     ))}

                     {/* Invite Form — Leader only */}
                     {canManageGroup && group.members.length + (group.invitations?.length || 0) < group.maxSize && (
                        <form onSubmit={handleInvite} className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-[#424754] bg-surface-container-highest/50">
                           <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="Invite member email" className="w-full text-xs bg-transparent text-on-surface border-none focus:ring-0 p-1 px-2" />
                           <button type="submit" disabled={actionLoading} className="p-1 rounded bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50">
                             <span className="material-symbols-outlined text-sm block">send</span>
                           </button>
                        </form>
                     )}
                  </div>
              </div>

              {/* Proposals Section */}
              {group.proposals?.length > 0 && (
                <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">description</span>
                      Project Proposals
                    </h2>
                    <Link href="/proposals" className="text-xs text-primary hover:underline font-bold uppercase tracking-widest">View All</Link>
                  </div>
                  
                  <div className="space-y-4">
                    {group.proposals.map((prop: any) => (
                      <div key={prop.id} className="p-4 rounded-xl bg-surface-container border border-[#3e495d] hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-sm text-on-surface truncate pr-4">{prop.title}</h4>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
                              prop.status === 'ACCEPTED' ? 'bg-primary/10 text-primary border border-primary/20' : 
                              prop.status === 'REVISION_REQUESTED' ? 'bg-secondary/10 text-secondary border border-secondary/20 animate-pulse' : 
                              prop.status === 'PENDING' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 
                              'bg-surface-container-highest text-on-surface-variant'
                           }`}>
                             {prop.status.replace("_", " ")}
                           </span>
                        </div>
                        
                        {prop.rejectionComment && (
                           <div className={`mt-3 p-3 rounded-lg border text-xs ${prop.status === "REVISION_REQUESTED" ? 'bg-secondary/5 border-secondary/20' : 'bg-surface-container-low border-outline/10'}`}>
                              <p className="font-bold text-secondary mb-1 uppercase tracking-widest text-[9px]">Supervisor Feedback:</p>
                              <p className="text-on-surface-variant line-clamp-2 italic">"{prop.rejectionComment}"</p>
                              <Link href={`/proposals/${prop.id}`} className="mt-2 text-primary hover:underline font-bold flex items-center gap-1">
                                 Read Full Feedback <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                              </Link>
                           </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-outline/5 flex justify-between items-center">
                           <span className="text-[10px] text-on-surface-variant">Submitted to: {prop.teacher?.email?.split('@')[0]}</span>
                           <Link href={`/proposals/${prop.id}`} className="text-xs text-primary font-bold hover:underline">Details</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

           </div>

           <div className="space-y-6">
             <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
               <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                 <span className="material-symbols-outlined text-tertiary">check_circle</span>
                 Milestone Checklist
               </h2>
               <div className="space-y-4">
                 {[
                   { task: "Create or join a group", done: true },
                   { task: "Identify primary research domain", done: false },
                   { task: "Find and finalize supervisor", done: false },
                   { task: "Submit official proposal abstract", done: false },
                 ].map((item, i) => (
                   <div key={i} className="flex gap-3">
                     <div className="mt-0.5">
                        {item.done ? (
                           <span className="material-symbols-outlined text-primary">task_alt</span>
                        ) : (
                           <span className="material-symbols-outlined text-outline">radio_button_unchecked</span>
                        )}
                     </div>
                     <div>
                       <p className={`text-sm ${item.done ? "text-on-surface-variant line-through" : "font-medium"}`}>
                          {item.task}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
