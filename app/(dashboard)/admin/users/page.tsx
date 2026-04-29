"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/admin/users?search=${search}&role=${filterRole}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const updateUser = async (userId: string, updates: any) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, updates })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-on-surface-variant text-sm mt-1">Verify accounts and manage roles for students and teachers.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full border border-outline/20">
              Total Users: {users.length}
            </span>
          </div>
        </div>

        {/* Filters Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-4 rounded-2xl border border-[#222a3d]">
          <form onSubmit={handleSearch} className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by email or roll number..."
              className="w-full bg-surface-container-highest border border-outline/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
          </form>
          <select
            className="bg-surface-container-highest border border-outline/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-surface-container-low border border-[#222a3d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/50 border-b border-[#222a3d]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">User Info</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Role & Origin</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant">No users found matching your criteria.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setSelectedUser(user)}
                            className="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline/10 flex items-center justify-center font-bold text-primary overflow-hidden cursor-pointer hover:border-primary transition-colors"
                          >
                            {user.profileImage ? (
                               <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                               user.email.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{user.email}</p>
                            <p className="text-[11px] text-on-surface-variant font-mono">{user.rollNumber || user.designation || "No Detail"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${
                            user.role === 'ADMIN' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                            user.role === 'TEACHER' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                            'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {user.role}
                          </span>
                          <p className="text-[10px] text-outline">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-success shadow-[0_0_8px_rgba(var(--success-rgb),0.5)]' : 'bg-outline animate-pulse'}`}></div>
                          <span className={`text-xs font-medium ${user.isVerified ? 'text-on-surface' : 'text-outline'}`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!user.isVerified && (
                            <button
                              onClick={() => updateUser(user.id, { isVerified: true })}
                              disabled={actionLoading === user.id}
                              className="p-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-success/20 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">verified_user</span>
                              Verify
                            </button>
                          )}
                          <button
                             onClick={() => updateUser(user.id, { isVerified: !user.isVerified })}
                             disabled={actionLoading === user.id}
                             className="p-2 bg-surface-container-highest text-on-surface hover:bg-[#31394d] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-outline/20 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">{user.isVerified ? 'block' : 'undo'}</span>
                            {user.isVerified ? 'Suspend' : 'Redo'}
                          </button>
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
 
       {/* User Detail Modal */}
       {selectedUser && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedUser(null)}>
           <div 
             className="bg-surface-container-low border border-[#222a3d] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
               <button 
                 onClick={() => setSelectedUser(null)}
                 className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors backdrop-blur-md"
               >
                 <span className="material-symbols-outlined">close</span>
               </button>
             </div>
 
             <div className="px-8 pb-8 -mt-12 relative">
               <div className="flex flex-col md:flex-row gap-6 items-start">
                 <div className="w-32 h-32 rounded-3xl border-4 border-surface-container-low bg-surface-container-highest overflow-hidden shadow-xl">
                   {selectedUser.profileImage ? (
                     <img src={selectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary">
                       {selectedUser.email.charAt(0).toUpperCase()}
                     </div>
                   )}
                 </div>
 
                 <div className="flex-1 pt-12 md:pt-14">
                   <h2 className="text-2xl font-bold text-on-surface">{selectedUser.email}</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                       selectedUser.role === 'ADMIN' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                       selectedUser.role === 'TEACHER' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                       'bg-primary/10 text-primary border-primary/20'
                     }`}>
                       {selectedUser.role}
                     </span>
                     {selectedUser.isVerified && (
                       <span className="flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-widest">
                         <span className="material-symbols-outlined text-[14px]">verified</span>
                         Verified
                       </span>
                     )}
                   </div>
                 </div>
               </div>
 
               <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <div>
                     <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Academic Details</h3>
                     <div className="space-y-3">
                       <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-on-surface-variant">school</span>
                         <div>
                           <p className="text-[10px] text-outline uppercase font-bold">Program / Designation</p>
                           <p className="text-sm font-medium">{selectedUser.program || selectedUser.designation || "N/A"}</p>
                         </div>
                       </div>
                       {selectedUser.role === "STUDENT" && (
                         <>
                           <div className="flex items-center gap-3">
                             <span className="material-symbols-outlined text-on-surface-variant">fingerprint</span>
                             <div>
                               <p className="text-[10px] text-outline uppercase font-bold">Roll Number</p>
                               <p className="text-sm font-medium">{selectedUser.rollNumber || "N/A"}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
                             <div>
                               <p className="text-[10px] text-outline uppercase font-bold">Batch</p>
                               <p className="text-sm font-medium">{selectedUser.batch || "N/A"}</p>
                             </div>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
 
                   {selectedUser.role === "TEACHER" && selectedUser.domainTags?.length > 0 && (
                     <div>
                       <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Expertise</h3>
                       <div className="flex flex-wrap gap-2">
                         {selectedUser.domainTags.map((tag: string, i: number) => (
                           <span key={i} className="px-3 py-1 bg-surface-container-highest text-on-surface text-[11px] font-medium rounded-full border border-outline/10">
                             {tag}
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
 
                 <div className="space-y-6">
                   <div>
                     <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Account Info</h3>
                     <div className="space-y-3">
                       <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-on-surface-variant">event</span>
                           <div>
                             <p className="text-[10px] text-outline uppercase font-bold">Joined On</p>
                             <p className="text-sm font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="material-symbols-outlined text-on-surface-variant">person_check</span>
                           <div>
                             <p className="text-[10px] text-outline uppercase font-bold">Verification Status</p>
                             <p className={`text-sm font-bold ${selectedUser.isVerified ? "text-success" : "text-warning"}`}>
                               {selectedUser.isVerified ? "Approved" : "Pending Approval"}
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
 
                     {selectedUser.bio && (
                       <div>
                         <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Biography</h3>
                         <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4">
                           {selectedUser.bio}
                         </p>
                       </div>
                     )}
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
