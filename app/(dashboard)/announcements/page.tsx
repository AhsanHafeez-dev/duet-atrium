"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { formatDistanceToNow } from "date-fns";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/announcements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const headers = { "Authorization": `Bearer ${token}` };

    fetch("/api/auth/me", { headers }).then(r => r.json()).then(d => {
       if (d.success) {
          setUser(d.user);
          if (d.user.role === "TEACHER") {
             fetch("/api/teacher/groups", { headers }).then(r => r.json()).then(gd => {
                if (gd.success) setGroups(gd.groups);
             });
          }
       }
    });

    fetchAnnouncements();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          body, 
          targetType: user.role === "ADMIN" ? targetType : (targetType === "ALL" ? "ALL_SUPERVISED" : targetType),
          targetGroupId: targetType === "SPECIFIC_GROUP" ? targetGroupId : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Announcement posted!");
        setTitle("");
        setBody("");
        fetchAnnouncements();
      } else {
        setError(data.error || "Failed to post");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-8 px-4 py-6 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">Announcements</h1>
            <p className="text-on-surface-variant text-lg mt-2">Broadcast important updates and stay synchronized with the FYP lifecycle.</p>
          </div>
        </div>

        {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
          <div className="bg-surface-container-low rounded-2xl p-6 border border-primary/20 shadow-xl shadow-primary/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">add_comment</span>
              Create Announcement
            </h2>
            <form onSubmit={handlePost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input 
                   type="text" 
                   placeholder="Headline / Title" 
                   required 
                   value={title}
                   onChange={e => setTitle(e.target.value)}
                   className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm focus:ring-0"
                 />
                 <div className="flex gap-2">
                   <select 
                      value={targetType}
                      onChange={e => setTargetType(e.target.value)}
                      className="flex-1 bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm focus:ring-0 appearance-none"
                   >
                      {user.role === "ADMIN" ? (
                        <>
                           <option value="ALL">Everyone</option>
                           <option value="TEACHERS_ONLY">Teachers Only</option>
                           <option value="STUDENTS_ONLY">Students Only</option>
                        </>
                      ) : (
                        <>
                           <option value="ALL">All My Supervised Groups</option>
                           <option value="SPECIFIC_GROUP">Specific Group</option>
                        </>
                      )}
                   </select>
                   {targetType === "SPECIFIC_GROUP" && (
                      <select 
                         value={targetGroupId}
                         onChange={e => setTargetGroupId(e.target.value)}
                         required
                         className="flex-1 bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm focus:ring-0 appearance-none"
                      >
                         <option value="">Select Group...</option>
                         {groups.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
                      </select>
                   )}
                 </div>
              </div>
              <textarea 
                placeholder="Compose your message..." 
                required 
                rows={3}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm focus:ring-0 resize-none"
              ></textarea>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${error ? 'text-error' : 'text-primary'}`}>{error || success}</span>
                <button 
                  type="submit" 
                  disabled={isPosting}
                  className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isPosting ? "Posting..." : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
             <div className="text-center p-10"><span className="material-symbols-outlined text-4xl animate-spin text-primary/50">progress_activity</span></div>
          ) : announcements.length === 0 ? (
             <div className="p-20 border border-dashed border-outline-variant/30 rounded-3xl text-center">
                <span className="material-symbols-outlined text-6xl text-outline mb-4 opacity-20">campaign</span>
                <p className="text-on-surface-variant text-lg">No announcements at the moment.</p>
             </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 hover:bg-surface-container transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                   <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[9px] font-bold uppercase tracking-widest border border-outline-variant/10">
                      {ann.targetType?.replace(/_/g, " ")}
                   </span>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-outline-variant/10 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">campaign</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{ann.title}</h2>
                    <p className="text-on-surface-variant leading-relaxed mb-6 whitespace-pre-wrap">{ann.body}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                           {ann.author.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">
                           {ann.author.email.split('@')[0]} • <span className="uppercase text-primary/80">{ann.author.role}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-outline font-bold uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(ann.createdAt))} ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
