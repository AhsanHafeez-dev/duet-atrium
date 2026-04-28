"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

type Member = {
  studentId: string;
  role: string;
  student: { id: string; email: string; rollNumber?: string; program?: string };
};

type Invitation = {
  id: string;
  invitee: { email: string };
  status: string;
  expiresAt: string;
};

type Group = {
  id: string;
  status: string;
  maxSize: number;
  members: Member[];
  invitations: Invitation[];
};

type PendingInvitation = {
  id: string;
  token: string;
  group: { id: string; leader: { email: string }; members: Member[] };
};

export default function GroupsPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [forming, setForming] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("access_token");

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setGroup(data.group);
        setUserRole(data.userRole || "");
        if (data.pendingInvitation) setPendingInvitation(data.pendingInvitation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleFormGroup = async () => {
    setForming(true);
    setError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchGroup();
      } else {
        setError(data.error || "Failed to form group");
      }
    } catch {
      setError("Network error");
    } finally {
      setForming(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviteLoading(true);
    try {
      const res = await fetch("/api/groups/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        fetchGroup();
      } else {
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRespondToInvitation = async (inviteId: string, accept: boolean) => {
    setActionLoading(true);
    const url = `/api/groups/invites/${inviteId}/${accept ? "accept" : "reject"}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setPendingInvitation(null);
        fetchGroup();
      }
    } catch {
      console.error("Failed to respond to invitation");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
            Group Formation
          </h1>
          <p className="text-on-surface-variant text-base mt-2 max-w-xl">
            Form your FYP group, invite teammates, and manage membership.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-semibold border border-error/20">
            {error}
          </div>
        )}

        {/* Pending Invitation Banner */}
        {!group && pendingInvitation && (
          <div className="relative bg-surface-container-low border border-primary/40 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tertiary"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-3xl">mail</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">You have a pending invitation!</h2>
                <p className="text-on-surface-variant text-sm">
                  <strong className="text-on-surface">
                    {pendingInvitation.group.leader.email.split("@")[0]}
                  </strong>{" "}
                  has invited you to join group{" "}
                  <strong className="text-primary">{pendingInvitation.group.id}</strong> with{" "}
                  {pendingInvitation.group.members.length} member(s) so far.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleRespondToInvitation(pendingInvitation.id, true)}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Accept
                </button>
                <button
                  onClick={() => handleRespondToInvitation(pendingInvitation.id, false)}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none px-6 py-3 bg-surface-container-highest text-on-surface-variant font-semibold rounded-xl hover:bg-[#3e495d] transition-colors disabled:opacity-50 border border-[#424754]"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Group State */}
        {!group && !pendingInvitation && (
          <div className="bg-surface-container-low border border-dashed border-[#3e495d] rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-outline">group_add</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">You are not in a group yet</h2>
            <p className="text-on-surface-variant text-base max-w-md mx-auto mb-8 leading-relaxed">
              Start by forming your own group. You'll become the group leader and can invite up to 3
              teammates.
            </p>
            <button
              onClick={handleFormGroup}
              disabled={forming}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto shadow-lg shadow-primary/20"
            >
              {forming ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined">add</span>
              )}
              Form New Group
            </button>
          </div>
        )}

        {/* Active Group */}
        {group && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Group Info & Members */}
            <div className="lg:col-span-2 space-y-6">
              {/* Group Header Card */}
              <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{group.id}</h2>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          group.status === "ACTIVE"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : group.status === "FROZEN"
                            ? "bg-error/10 text-error border border-error/20"
                            : "bg-surface-container-highest text-on-surface-variant border border-[#424754]"
                        }`}
                      >
                        {group.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {group.members.length} / {group.maxSize} Members
                      {userRole && (
                        <span className="ml-2 px-2 py-0.5 bg-secondary-container/40 text-secondary text-[10px] font-bold rounded uppercase tracking-widest">
                          You: {userRole.replace("_", " ")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Members Grid */}
                <div>
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                    Current Roster
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.members.map((m) => (
                      <div
                        key={m.studentId}
                        className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-highest border border-[#3e495d]"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface border border-[#424754] flex items-center justify-center font-bold text-primary">
                          {m.student.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {m.student.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {m.role.replace("_", " ")}
                            {m.student.rollNumber ? ` • ${m.student.rollNumber}` : ""}
                          </p>
                        </div>
                        {m.role === "LEADER" && (
                          <span className="material-symbols-outlined text-primary text-sm">
                            star
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: group.maxSize - group.members.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[#424754] text-outline"
                      >
                        <div className="w-10 h-10 rounded-full border border-dashed border-[#424754] flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">person_add</span>
                        </div>
                        <span className="text-sm">Open Slot</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending Outgoing Invitations */}
              {group.invitations && group.invitations.length > 0 && (
                <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-tertiary">
                      pending
                    </span>
                    Pending Invitations ({group.invitations.length})
                  </h3>
                  <div className="space-y-3">
                    {group.invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-container-highest border border-[#3e495d]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-tertiary text-sm">
                              schedule_send
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{inv.invitee.email}</p>
                            <p className="text-xs text-on-surface-variant">
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Invite Panel */}
            <div className="space-y-6">
              {(userRole === "LEADER" || userRole === "CO_LEADER") &&
                group.members.length < group.maxSize && (
                  <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">person_add</span>
                      Invite Member
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-6">
                      Enter a student&apos;s DUET email address to send them an invitation.
                    </p>

                    {inviteError && (
                      <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-xs font-semibold">
                        {inviteError}
                      </div>
                    )}
                    {inviteSuccess && (
                      <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                        {inviteSuccess}
                      </div>
                    )}

                    <form onSubmit={handleInvite} className="space-y-4">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                          alternate_email
                        </span>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="student@students.duet.edu.pk"
                          required
                          className="w-full h-12 bg-surface-container-highest text-on-surface placeholder:text-outline border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-11 pr-4 transition-all text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={inviteLoading || !inviteEmail}
                        className="w-full h-11 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {inviteLoading ? (
                          <span className="material-symbols-outlined animate-spin text-lg">
                            progress_activity
                          </span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">send</span>
                            Send Invitation
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

              {group.members.length >= group.maxSize && (
                <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-primary mb-3 block">
                    group
                  </span>
                  <h3 className="font-bold mb-1">Group is Full</h3>
                  <p className="text-sm text-on-surface-variant">
                    Your group has reached the maximum of {group.maxSize} members.
                  </p>
                </div>
              )}

              {/* Group Info Card */}
              <div className="bg-surface-container-low border border-[#2d3449] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  Group Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Group ID</span>
                    <span className="font-mono font-semibold text-primary">{group.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Status</span>
                    <span className="font-semibold">{group.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Capacity</span>
                    <span className="font-semibold">
                      {group.members.length} / {group.maxSize}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
