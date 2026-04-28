"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ProposalReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     const headers = { "Authorization": `Bearer ${token}` };

     Promise.all([
        fetch("/api/auth/me", { headers }).then(r => r.json()),
        fetch(`/api/proposals/${id}`, { headers }).then(r => r.json())
     ]).then(([uData, pData]) => {
        if (uData.user) setUser(uData.user);
        if (pData.success) setProposal(pData.proposal);
        setLoading(false);
     }).catch(err => {
        console.error(err);
        setLoading(false);
     });
  }, [id]);

  const handleAction = async (action: "approve" | "reject" | "revise") => {
     if ((action === "reject" || action === "revise") && !feedback.trim()) {
        setError("Feedback is required for rejection or revision requests.");
        return;
     }

     setActionLoading(true);
     setError("");
     try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`/api/proposals/${id}/review`, {
           method: "POST",
           headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({ action, feedback })
        });
        const data = await res.json();
        
        if (res.ok) {
           router.push("/dashboard");
        } else {
           setError(data.error || "Failed to submit review");
        }
     } catch (err) {
        setError("Network error");
     } finally {
        setActionLoading(false);
     }
  };

  if (loading) return <div className="text-center p-10 mt-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  if (!proposal) return <div className="text-center p-10">Proposal not found or unauthorized.</div>;

  const isTeacher = user?.role === "TEACHER";

  return (
    <AuthGuard>
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 bg-surface scroll-smooth relative max-h-screen">
        <div className="max-w-7xl mx-auto mb-6 flex items-center text-sm font-label text-on-surface-variant uppercase tracking-widest">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[1rem]">arrow_back</span> Dashboard</Link>
          <span className="material-symbols-outlined text-[1rem] mx-2 opacity-50">chevron_right</span>
          <span className="text-primary truncate max-w-[200px] inline-block">{proposal.title}</span>
        </div>

        {error && <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl text-sm font-semibold bg-error-container text-on-error-container border border-error-container/50">{error}</div>}

        <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-headline font-bold tracking-tighter text-on-surface mb-3 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
                 {proposal.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-4">
               <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-medium border border-outline-variant/10">Submitted: {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : 'N/A'}</span>
               {proposal.proposedStack?.map((tech: string, i: number) => (
                  <span key={i} className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">{tech}</span>
               ))}
            </div>
          </div>
          
          <div className="flex items-center px-4 py-2 bg-surface-container-high rounded-lg border border-outline-variant/10 shrink-0">
            <div className={`w-2 h-2 rounded-full mr-3 ${proposal.status === "PENDING" ? 'bg-tertiary animate-pulse' : (proposal.status === "ACCEPTED" ? 'bg-primary' : (proposal.status === "REVISION_REQUESTED" ? 'bg-secondary animate-pulse' : 'bg-error'))}`}></div>
            <span className={`text-sm font-medium ${proposal.status === "PENDING" ? 'text-tertiary' : (proposal.status === "ACCEPTED" ? 'text-primary' : (proposal.status === "REVISION_REQUESTED" ? 'text-secondary' : 'text-error'))}`}>
               {proposal.status.replace("_", " ")}
            </span>
          </div>

        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 border border-outline-variant/5">
              <div className="flex items-center mb-6 text-on-surface-variant">
                <span className="material-symbols-outlined mr-3">subject</span>
                <h3 className="text-lg font-headline font-semibold text-on-surface tracking-tight">Executive Abstract</h3>
              </div>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{proposal.abstract}</p>
            </section>

            <section className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 border border-outline-variant/5">
              <div className="flex items-center mb-6 text-on-surface-variant">
                <span className="material-symbols-outlined mr-3">architecture</span>
                <h3 className="text-lg font-headline font-semibold text-on-surface tracking-tight">Problem Statement</h3>
              </div>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{proposal.problemStatement}</p>
            </section>

            {(proposal.researchPapers?.length > 0 || proposal.diagramUrl || proposal.presentationUrl || proposal.Document?.length > 0) && (
               <section className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 border border-outline-variant/5">
                  <div className="flex items-center mb-6 text-on-surface-variant">
                    <span className="material-symbols-outlined mr-3">library_books</span>
                    <h3 className="text-lg font-headline font-semibold text-on-surface tracking-tight">Supporting Material</h3>
                  </div>
                  
                  {/* Documents from DB relation */}
                  {proposal.Document?.length > 0 && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {proposal.Document.map((doc: any) => (
                           <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl hover:bg-surface-container-highest transition-colors group">
                              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <span className="material-symbols-outlined">
                                    {doc.fileType === 'pdf' ? 'picture_as_pdf' : (doc.fileType === 'pptx' ? 'slideshow' : 'description')}
                                 </span>
                              </div>
                              <div className="overflow-hidden">
                                 <p className="text-sm font-semibold truncate text-on-surface">{doc.filename}</p>
                                 <p className="text-xs text-on-surface-variant uppercase tracking-widest">{doc.fileType} • {(doc.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                              </div>
                           </a>
                        ))}
                     </div>
                  )}

                  {proposal.diagramUrl && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-widest">System Diagram</h4>
                      <a href={proposal.diagramUrl} target="_blank" rel="noopener noreferrer" className="block max-w-sm rounded overflow-hidden border border-outline/20 hover:opacity-80 transition-opacity">
                        <img src={proposal.diagramUrl} alt="System Architecture / Use Case" className="w-full h-auto" />
                      </a>
                    </div>
                  )}
                  
                  {proposal.presentationUrl && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-widest">Draft Presentation</h4>
                      <a href={proposal.presentationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded text-primary hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[20px]">slideshow</span>
                        View .PPTX File
                      </a>
                    </div>
                  )}
                  
                  {proposal.researchPapers?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-widest">Reference Material</h4>
                      <ul className="list-disc list-inside space-y-2 text-on-surface-variant">
                        {proposal.researchPapers.map((paper: string, i: number) => {
                           const isLink = paper.startsWith('http');
                           return (
                             <li key={i} className="text-sm">
                               {isLink ? <a href={paper} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline break-all">{paper}</a> : <span className="break-all">{paper}</span>}
                             </li>
                           );
                        })}
                      </ul>
                    </div>
                  )}
               </section>
            )}


            <section>
              <h3 className="text-sm font-label font-semibold text-on-surface-variant uppercase tracking-widest mb-4 ml-2">Project Team ({proposal.group.members.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proposal.group.members.map((m: any) => (
                  <div key={m.id} className="bg-surface-container-low rounded-xl p-5 flex items-center space-x-4 border border-outline-variant/5">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest text-xl font-bold flex items-center justify-center text-primary border border-[#424754]">
                       {m.student.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-on-surface">{m.student.email.split('@')[0]}</h4>
                      <p className="text-xs text-primary/80 font-medium">{m.role} • {m.student.program || "Unknown"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              
              {/* Feedback display for students/teachers if already reviewed */}
              {proposal.rejectionComment && (
                  <div className={`rounded-xl p-6 border ${proposal.status === "REVISION_REQUESTED" ? 'bg-secondary-container/20 border-secondary/30' : 'bg-surface-container-low border-error-container/30'}`}>
                    <h3 className={`text-sm font-label font-semibold uppercase tracking-widest mb-4 ${proposal.status === "REVISION_REQUESTED" ? 'text-secondary' : 'text-error'}`}>
                       {proposal.status === "REVISION_REQUESTED" ? 'Revision Requested' : 'Feedback / Comments'}
                    </h3>
                    <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{proposal.rejectionComment}</p>
                    
                    {((proposal.status === "REVISION_REQUESTED") || (proposal.status === "PENDING" && proposal.rejectionComment)) && !isTeacher && user?.membership?.role === "LEADER" && (
                       <div className="mt-8 space-y-4">
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                             <span className="material-symbols-outlined text-primary">info</span>
                             <p className="text-xs text-on-surface-variant leading-relaxed">
                                This view is read-only. To address the feedback and make changes, please click the button below to enter the editing form.
                             </p>
                          </div>
                          
                          <Link 
                             href={`/proposals/new?revisionId=${proposal.id}`} 
                             className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group"
                          >
                             <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">edit_note</span>
                             <span>Edit & Resubmit Proposal</span>
                          </Link>
                       </div>
                    )}
                  </div>
              )}


              {isTeacher && proposal.status === "PENDING" && (
                  <div className="bg-surface-container-highest/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-surface-bright/30 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                    <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Faculty Evaluation</h3>
                    <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Provide constructive feedback. This will be visible to the student group.</p>
                    
                    <div className="relative group mb-6">
                       <textarea 
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          className="w-full bg-surface-container rounded-t-xl border-0 border-b-2 border-outline/30 focus:border-primary focus:ring-0 transition-colors p-4 text-sm text-on-surface placeholder:text-outline-variant/60 resize-y" 
                          placeholder="Enter detailed structural or methodological feedback here..." 
                          rows={5}
                       />
                    </div>

                    <div className="flex flex-col space-y-3 pt-2">
                       <button onClick={() => handleAction("approve")} disabled={actionLoading} className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-lg py-3.5 px-4 font-semibold text-sm tracking-wide hover:brightness-110 transition-all flex justify-center items-center disabled:opacity-50">
                          <span className="material-symbols-outlined mr-2 text-[1.1rem]">task_alt</span>
                          Approve Proposal
                       </button>
                       <button onClick={() => handleAction("revise")} disabled={actionLoading} className="w-full border border-outline-variant/20 bg-transparent text-secondary hover:text-inverse-surface hover:bg-surface-container rounded-lg py-3 px-4 font-medium text-sm transition-colors flex justify-center items-center disabled:opacity-50">
                          <span className="material-symbols-outlined mr-2 text-[1.1rem]">draw</span>
                          Request Revisions
                       </button>
                       <button onClick={() => handleAction("reject")} disabled={actionLoading} className="w-full bg-transparent text-error hover:bg-error/10 rounded-lg py-2 px-4 font-medium text-xs transition-colors flex justify-center items-center mt-2 disabled:opacity-50">
                          Reject Proposal Completely
                       </button>
                    </div>
                  </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
