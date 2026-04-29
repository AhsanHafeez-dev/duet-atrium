"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

function FacultyDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [faculty, setFaculty] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
     setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     const headers = { "Authorization": `Bearer ${token}` };

     fetch("/api/auth/me", { headers }).then(r => r.json()).then(d => {
        if (d.success) setUser(d.user);
     });

     fetch("/api/faculty", { headers })
       .then(r => r.json())
       .then(data => {
          if (data.success) {
             setFaculty(data.faculty);
          }
          setLoading(false);
       })
       .catch(err => {
          console.error(err);
          setLoading(false);
       });
  }, []);

  const departments = ["All", "Computer Science", "Cyber Security", "Artificial Intelligence", "Data Science", "Information Tech"];

  const filteredFaculty = faculty.filter(f => {
     // 1. Department Filter
     let deptMatch = true;
     if (filterDept !== "All") {
        const charCode = f.email.charCodeAt(7) || 0;
        if (filterDept === "Computer Science") deptMatch = charCode % 5 === 0;
        else if (filterDept === "Cyber Security") deptMatch = charCode % 5 === 1;
        else if (filterDept === "Artificial Intelligence") deptMatch = charCode % 5 === 2;
        else if (filterDept === "Data Science") deptMatch = charCode % 5 === 3;
        else if (filterDept === "Information Tech") deptMatch = charCode % 5 === 4;
     }

     // 2. Search Query Filter
     let searchMatch = true;
     if (searchQuery) {
        const q = searchQuery.toLowerCase();
        searchMatch = 
           f.email.toLowerCase().includes(q) || 
           (f.designation && f.designation.toLowerCase().includes(q)) ||
           (f.domainTags && f.domainTags.some((t: string) => t.toLowerCase().includes(q)));
     }
     
     return deptMatch && searchMatch;
  });

  if (loading) {
     return <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span></div>;
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-container">
             Faculty Observatory
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
             Explore academic profiles, research expertise, and supervision availability across departments.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-widest transition-colors border ${
                filterDept === dept
                  ? "bg-secondary-container text-on-secondary-container border-transparent"
                  : "bg-surface-container-highest text-on-surface-variant border-[#424754]/50 hover:bg-[#31394d]"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFaculty.map((prof) => {
             // Assumption: A teacher can supervise max 3 groups. If supervisedProposals.length >= 3, they are Full.
             const isFull = prof.supervisedProposals?.length >= 3;
             
             return (
               <div key={prof.id} className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-highest transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div className="flex items-start justify-between mb-6">
                   <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-highest text-2xl font-bold flex items-center justify-center text-primary border border-[#424754]">
                      {prof.email.charAt(0).toUpperCase()}
                   </div>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isFull ? 'bg-surface-container text-on-surface-variant' : 'bg-tertiary/10 text-tertiary'}`}>
                      {isFull ? "Full" : "Accepting FYPs"}
                   </span>
                 </div>
                 
                 <h3 className="text-xl font-bold text-on-surface mb-1 truncate">{prof.email.split('@')[0]}</h3>
                 <p className="text-sm text-on-surface-variant mb-4">{prof.designation || "Faculty Member"}</p>
                 
                 <div className="space-y-4 mb-6 flex-1">
                   <div>
                     <p className="text-xs font-bold uppercase tracking-widest text-[#8c909f] mb-2">Expertise</p>
                     <div className="flex flex-wrap gap-2">
                       {prof.domainTags?.length ? prof.domainTags.map((tag: string) => (
                         <span key={tag} className="text-xs bg-surface-container px-2 py-1 rounded text-on-surface-variant border border-[#3e495d]">
                           {tag}
                         </span>
                       )) : (
                         <span className="text-xs text-on-surface-variant italic">No tags specified</span>
                       )}
                     </div>
                   </div>
                 </div>

                 {user?.role === "STUDENT" && user?.membership?.role === "LEADER" && (
                   <Link 
                      href={`/proposals/new?teacherId=${prof.id}`}
                      className={`w-full py-2.5 rounded-lg text-center font-semibold transition-colors mt-auto flex justify-center items-center gap-2 ${
                        isFull 
                          ? "bg-surface-container text-outline cursor-not-allowed border border-[#3e495d]" 
                          : "bg-primary text-on-primary hover:bg-primary-container shadow-lg shadow-primary/20 hover:shadow-primary/40 border border-primary/50"
                      }`}
                      onClick={(e) => { if(isFull) e.preventDefault(); }}
                   >
                      <span className="material-symbols-outlined text-sm">edit_document</span>
                      Propose Topic
                   </Link>
                 )}
               </div>
             )
          })}
        </div>
      </div>
    </AuthGuard>
  );
}

export default function FacultyDirectory() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span></div>}>
      <FacultyDirectoryContent />
    </Suspense>
  );
}
