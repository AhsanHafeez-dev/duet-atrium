"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SubmitProposal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTeacherId = searchParams?.get("teacherId") || "";
  const revisionId = searchParams?.get("revisionId") || "";

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [abstract, setAbstract] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [researchPapersText, setResearchPapersText] = useState("");
  const [stack, setStack] = useState<string[]>([]);
  const [customStack, setCustomStack] = useState("");
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [diagramName, setDiagramName] = useState("");
  const [presentationName, setPresentationName] = useState("");
  const [existingDiagramUrl, setExistingDiagramUrl] = useState<string | null>(null);
  const [existingPresentationUrl, setExistingPresentationUrl] = useState<string | null>(null);
  const [fetchingRevision, setFetchingRevision] = useState(false);

  const TECH_OPTIONS = [
    "React", "Next.js", "Node.js", "Express", "Python", "Django", "Flask", "FastAPI", 
    "Java", "Spring Boot", "C++", "C#", ".NET", "PHP", "Laravel", "Ruby", "Ruby on Rails", 
    "Go", "Rust", "Swift", "Kotlin", "React Native", "Flutter", "Dart", 
    "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "OpenCV", "NLP", "Machine Learning", 
    "Deep Learning", "Computer Vision", "Blockchain", "Solidity", "Smart Contracts", 
    "IoT", "Arduino", "Raspberry Pi", "AWS", "Azure", "Google Cloud", "Docker", 
    "Kubernetes", "Firebase", "Supabase", "MongoDB", "PostgreSQL", "MySQL", "Redis", 
    "GraphQL", "REST API", "WebSockets", "AR/VR", "Unity", "Unreal Engine", 
    "Cybersecurity", "Penetration Testing", "Digital Forensics"
  ];

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     const headers = { "Authorization": `Bearer ${token}` };

     // Fetch User & Role Check
     fetch("/api/auth/me", { headers })
       .then(r => r.json())
       .then(data => {
          if (data.success) {
             setUser(data.user);
             if (data.user.role === "STUDENT" && data.user.membership?.role !== "LEADER") {
                router.push("/dashboard");
             }
          }
       });

     // Fetch Faculty
     fetch("/api/faculty", { headers })
       .then(r => r.json())
       .then(data => {
          if (data.success) {
             setTeachers(data.faculty);
          }
       });

     // Fetch existing proposal if it's a revision
     if (revisionId) {
        setFetchingRevision(true);
        fetch(`/api/proposals/${revisionId}`, { headers })
           .then(r => r.json())
           .then(data => {
              if (data.success) {
                 const p = data.proposal;
                 setTitle(p.title);
                 setTeacherId(p.teacherId);
                 setAbstract(p.abstract);
                 setProblemStatement(p.problemStatement);
                 setResearchPapersText(p.researchPapers.join("\n"));
                 setStack(p.proposedStack || []);
                 setExistingDiagramUrl(p.diagramUrl);
                 setExistingPresentationUrl(p.presentationUrl);
              }
           })
           .catch(err => console.error("Failed to fetch revision data", err))
           .finally(() => setFetchingRevision(false));
     }
  }, [revisionId]);

  const handleStackToggle = (tech: string) => {
     setStack(prev => 
        prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
     );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "diagram" | "presentation") => {
     const file = e.target.files?.[0];
     if (!file) return;

     if (type === "diagram") {
        setDiagramName(file.name);
        setDiagramFile(file);
     }
     if (type === "presentation") {
        setPresentationName(file.name);
        setPresentationFile(file);
     }
  };

  const uploadFileToCloudinary = async (file: File, folder: string) => {
     const token = localStorage.getItem("access_token");
     // 1. Get signature
     const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ folder })
     });
     const signData = await signRes.json();
     if (!signRes.ok) throw new Error("Failed to get upload signature");

     // 2. Upload to Cloudinary
     const formData = new FormData();
     formData.append("file", file);
     formData.append("api_key", signData.apiKey);
     formData.append("timestamp", signData.timestamp.toString());
     formData.append("signature", signData.signature);
     formData.append("folder", signData.folder);

     const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
        method: "POST",
        body: formData
     });
     const uploadData = await uploadRes.json();
     if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Cloudinary upload failed");

     return uploadData.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError("");
     setLoading(true);

     let finalStack = [...stack];
     if (customStack) {
         finalStack = [...finalStack, ...customStack.split(",").map(t => t.trim())];
     }

     const papersList = researchPapersText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

     try {
        const token = localStorage.getItem("access_token");
        
        // 1. Handle Direct Uploads if files exist
        let diagramUrl = null;
        let presentationUrl = null;

        if (diagramFile) {
           diagramUrl = await uploadFileToCloudinary(diagramFile, "proposals_diagrams");
        }
        if (presentationFile) {
           presentationUrl = await uploadFileToCloudinary(presentationFile, "proposals_presentations");
        }

        // 2. Submit to backend
        const url = revisionId ? `/api/proposals/${revisionId}` : "/api/proposals";
        const method = revisionId ? "PATCH" : "POST";

        const res = await fetch(url, {
           method,
           headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({
              title,
              teacherId,
              abstract,
              problemStatement,
              proposedStack: finalStack,
              researchPapers: papersList,
              diagramUrl: diagramUrl || existingDiagramUrl, 
              presentationUrl: presentationUrl || existingPresentationUrl
           })
        });
        const data = await res.json();
        
        if (res.ok) {
           router.push("/dashboard");
        } else {
           setError(data.error || `Failed to ${revisionId ? 'update' : 'submit'} proposal`);
        }
     } catch (err) {
        setError("Network error");
     } finally {
        setLoading(false);
     }
  };
   if (fetchingRevision) {
      return (
         <AuthGuard>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
               <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
               <p className="text-on-surface-variant animate-pulse font-medium">Preparing your proposal for revision...</p>
            </div>
         </AuthGuard>
      );
   }

   return (
     <AuthGuard>
       <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero / Title Section */}
        <div className="mb-16 relative mt-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10">
            <Link href="/dashboard" className="text-secondary flex items-center gap-1 text-sm font-medium hover:text-primary mb-6 transition-colors w-max">
               <span className="material-symbols-outlined text-sm">arrow_back</span> Dashboard
            </Link>
            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs uppercase tracking-widest font-semibold mb-6">
                Proposal Submission
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 font-headline leading-tight">
                {revisionId ? "Edit & Resubmit Proposal" : "Submit Project Proposal"}
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
                {revisionId 
                  ? "Refine your academic inquiry based on supervisor feedback. Ensure all requested changes are addressed before resubmitting."
                  : "Formalize your academic inquiry. Provide a comprehensive overview of your intended Final Year Project to initiate the supervisory review process."}
            </p>
          </div>
        </div>

        {error && (
           <div className="p-4 rounded-xl text-sm font-semibold bg-error-container text-on-error-container border border-error-container/50">
              {error}
           </div>
        )}

        {/* The Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Section 1: Core Identity */}
          <div className="bg-surface-container-low rounded-xl p-8 md:p-10 transition-colors duration-300 hover:bg-surface-container relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-container-highest group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-xl font-bold text-on-surface mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary text-sm font-semibold">1</span>
              <span>Project Identity</span>
            </h3>
            
            <div className="space-y-8">
              <div>
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-medium">Project Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Predictive Modeling of Network Latency using Quantum Anomalies"
                  className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-4 transition-all duration-200 font-medium placeholder:text-outline/50" 
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-medium">Target Supervisor</label>
                <div className="relative">
                  <select 
                     required 
                     value={teacherId}
                     onChange={e => setTeacherId(e.target.value)}
                     className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-4 appearance-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="" disabled className="bg-surface-container-high text-on-surface-variant">Select a faculty advisor...</option>
                    {teachers.map(t => (
                       <option key={t.id} value={t.id} disabled={(t.supervisedProposals?.length >= 3) && (t.id !== teacherId)} className="bg-surface-container text-on-surface">
                          {t.email.split('@')[0]} - {t.designation} {t.supervisedProposals?.length >= 3 ? "(Full)" : ""}
                       </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: The Inquiry */}
          <div className="bg-surface-container-low rounded-xl p-8 md:p-10 transition-colors duration-300 hover:bg-surface-container relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-container-highest group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-xl font-bold text-on-surface mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary text-sm font-semibold">2</span>
              <span>The Inquiry</span>
            </h3>
            
            <div className="space-y-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium">Abstract</label>
                  <span className="text-xs text-outline">{abstract.split(" ").filter(w => w).length} words</span>
                </div>
                <textarea 
                   required 
                   value={abstract}
                   onChange={e => setAbstract(e.target.value)}
                   placeholder="Provide a concise summary of the project's objectives, methodology, and expected outcomes..."
                   rows={4} 
                   className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-4 transition-all duration-200 resize-y leading-relaxed placeholder:text-outline/50" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium">Problem Statement</label>
                </div>
                <p className="text-sm text-on-surface-variant mb-4 opacity-80">Clearly define the specific gap or issue this research intends to address.</p>
                <textarea 
                   required 
                   value={problemStatement}
                   onChange={e => setProblemStatement(e.target.value)}
                   placeholder="Describe the current state, the problem, and why it requires investigation..."
                   rows={4} 
                   className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-4 transition-all duration-200 resize-y leading-relaxed placeholder:text-outline/50" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-medium">Reference Material / Research Papers</label>
                </div>
                <p className="text-sm text-on-surface-variant mb-4 opacity-80">Provide links or citations to key papers (one per line).</p>
                <textarea 
                   value={researchPapersText}
                   onChange={e => setResearchPapersText(e.target.value)}
                   placeholder="https://doi.org/10...&#10;Author, A. (2025). Paper Title..."
                   rows={4} 
                   className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-4 transition-all duration-200 resize-y leading-relaxed placeholder:text-outline/50" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Technical Approach */}
          <div className="bg-surface-container-low rounded-xl p-8 md:p-10 transition-colors duration-300 hover:bg-surface-container relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-container-highest group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-xl font-bold text-on-surface mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary text-sm font-semibold">3</span>
              <span>Technical Approach</span>
            </h3>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-4 font-medium">Proposed Technology Stack</label>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-2 border border-outline-variant/20 rounded-xl bg-surface/50">
                 {TECH_OPTIONS.map(tech => (
                    <button
                       key={tech}
                       type="button"
                       onClick={() => handleStackToggle(tech)}
                       className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
                          stack.includes(tech) 
                            ? "bg-secondary-container text-on-secondary-container border-transparent" 
                            : "border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                       }`}
                    >
                       {tech}
                    </button>
                 ))}
              </div>
              
              <div className="mt-4">
                <input 
                   type="text" 
                   value={customStack}
                   onChange={e => setCustomStack(e.target.value)}
                   placeholder="Type custom technologies separated by commas..." 
                   className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 transition-all duration-200 text-sm placeholder:text-outline/50" 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Supporting Artifacts */}
          <div className="bg-surface-container-low rounded-xl p-8 md:p-10 transition-colors duration-300 hover:bg-surface-container relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-container-highest group-hover:bg-primary transition-colors duration-300"></div>
            <h3 className="text-xl font-bold text-on-surface mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary text-sm font-semibold">4</span>
              <span>Supporting Artifacts (Optional)</span>
            </h3>
            
            <div className="space-y-8">
              <div>
                 <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-medium">Use Case / ER Diagram</label>
                 <p className="text-sm text-on-surface-variant mb-3 opacity-80">Upload a system architecture, ER, or use case diagram (JPG/PNG).</p>
                 <div className="relative border-2 border-dashed border-outline-variant/30 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-surface-container-highest/20 hover:bg-surface-container-highest/50 transition-colors cursor-pointer">
                    <input 
                       type="file" 
                       accept="image/png, image/jpeg, image/jpg, image/webp"
                       onChange={(e) => handleFileUpload(e, "diagram")}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <span className="material-symbols-outlined text-3xl mb-2 text-primary/70">schema</span>
                    <p className="text-sm font-semibold text-on-surface">{diagramName || (existingDiagramUrl ? "Diagram already uploaded" : "Click to browse or drag an image")}</p>
                    {existingDiagramUrl && !diagramName && (
                       <a 
                          href={existingDiagramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 text-xs text-primary hover:underline flex items-center justify-center gap-1 relative z-10"
                       >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View current diagram
                       </a>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1">Image must be under 4MB</p>
                 </div>
              </div>

              <div>
                 <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-medium">Draft Presentation (.pptx)</label>
                 <p className="text-sm text-on-surface-variant mb-3 opacity-80">Upload a preliminary slide deck summarizing your problem statement.</p>
                 <div className="relative border-2 border-dashed border-outline-variant/30 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-surface-container-highest/20 hover:bg-surface-container-highest/50 transition-colors cursor-pointer">
                    <input 
                       type="file" 
                       accept=".pptx, .ppt, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation"
                       onChange={(e) => handleFileUpload(e, "presentation")}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <span className="material-symbols-outlined text-3xl mb-2 text-tertiary/70">slideshow</span>
                    <p className="text-sm font-semibold text-on-surface">{presentationName || (existingPresentationUrl ? "Presentation already uploaded" : "Click to browse or drag a .pptx file")}</p>
                    {existingPresentationUrl && !presentationName && (
                       <a 
                          href={existingPresentationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 text-xs text-tertiary hover:underline flex items-center justify-center gap-1 relative z-10"
                       >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View current presentation
                       </a>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1">PPTX file must be under 4MB</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Submission Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-4 pb-12">
            <button type="submit" disabled={loading || fetchingRevision} className="w-full sm:w-auto px-10 py-3 rounded-md bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50">
              <span>{loading ? (revisionId ? "Updating..." : "Submitting...") : (revisionId ? "Resubmit Changes" : "Submit Proposal")}</span>
              {!loading && <span className="material-symbols-outlined text-[1.25rem]">{revisionId ? 'publish' : 'send'}</span>}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
