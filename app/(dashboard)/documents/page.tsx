"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DocumentRepository() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [documentType, setDocumentType] = useState("MID_TERM_REPORT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDocs = () => {
     const token = localStorage.getItem("access_token");
     fetch("/api/documents", {
        headers: { "Authorization": `Bearer ${token}` }
     })
       .then(r => r.json())
       .then(data => {
          if (data.success) {
             setDocuments(data.documents);
          }
       })
       .finally(() => setLoading(false));
  };

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     const headers = { "Authorization": `Bearer ${token}` };

     fetch("/api/auth/me", { headers }).then(r => r.json()).then(d => {
         if(d.user) setUser(d.user);
     });
     fetchDocs();
  }, []);

  const uploadFileToCloudinary = async (file: File) => {
     const token = localStorage.getItem("access_token");
     // 1. Get signature
     const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ folder: "documents" })
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) {
         setError("Please select a file to upload.");
         return;
      }
      setError("");
      setSuccess("");
      setIsUploading(true);

      try {
         const token = localStorage.getItem("access_token");
         
         // 1. Direct Upload
         const finalUrl = await uploadFileToCloudinary(selectedFile);

         // 2. Save metadata to backend
         const res = await fetch("/api/documents", {
            method: "POST",
            headers: { 
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
               title: uploadTitle,
               documentType,
               fileUrl: finalUrl
            })
         });
         const data = await res.json();
         
         if (res.ok) {
            setSuccess("Document uploaded successfully.");
            setUploadTitle("");
            setSelectedFile(null);
            fetchDocs();
         } else {
            setError(data.error || "Failed to upload.");
         }
      } catch (err: any) {
         setError(err.message || "Network error");
      } finally {
         setIsUploading(false);
      }
  };

  return (
    <AuthGuard>
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-16 scroll-smooth bg-surface min-h-screen">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Document Repository</h1>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">Centralized archive for milestone submissions, institutional templates, and version-controlled artifacts.</p>
          </div>
        </div>

        {(error || success) && (
           <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border animate-in slide-in-from-top-2 duration-300 ${error ? 'bg-error-container text-on-error-container border-error-container' : 'bg-primary/20 text-primary border-primary/30'}`}>
              {error || success}
           </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
              
            {user?.role === "STUDENT" && (
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 group mb-10">
                   <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-primary">
                      <span className="material-symbols-outlined text-[22px]">upload_file</span>
                      Submit Artifact
                   </h2>
                   <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input 
                             type="text" 
                             placeholder="Document Title" 
                             required 
                             value={uploadTitle}
                             onChange={e => setUploadTitle(e.target.value)}
                             className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm placeholder:text-outline/70 focus:ring-0" 
                         />
                         <select 
                             value={documentType}
                             onChange={e => setDocumentType(e.target.value)}
                             className="w-full bg-surface-container-highest border-transparent border-b-2 focus:border-b-primary text-on-surface rounded-t-md px-4 py-3 text-sm focus:ring-0 appearance-none"
                         >
                             <option value="MID_TERM_REPORT">Mid-Term Report</option>
                             <option value="FINAL_REPORT">Final Report</option>
                             <option value="OTHER">Other / Misc</option>
                         </select>
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-xs text-on-surface-variant ml-1 font-medium">Select File (PDF, DOCX, ZIP etc.)</label>
                         <div className="flex items-center gap-4 p-4 border-2 border-dashed border-[#3e495d] rounded-xl bg-surface-container-highest/50">
                            <input 
                                type="file" 
                                required 
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                className="text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                            />
                         </div>
                      </div>
                      <button type="submit" disabled={isUploading} className="px-6 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold rounded-md hover:brightness-110 disabled:opacity-50">
                          {isUploading ? "Uploading..." : "Upload Document"}
                      </button>
                   </form>
                </div>
            )}

            <div className="flex items-center justify-between mb-4 mt-8 xl:mt-0">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
                Milestone Submissions
              </h2>
            </div>

            {loading ? (
               <div className="text-center p-10"><span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span></div>
            ) : documents.length === 0 ? (
               <div className="bg-surface-container-low rounded-xl p-10 text-center border border-outline-variant/5">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_open</span>
                  <p className="text-on-surface-variant font-medium">No documents uploaded yet.</p>
               </div>
            ) : documents.map((doc: any) => (
              <div key={doc.id} className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-colors duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden border border-outline-variant/5">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary-container opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="flex-shrink-0 w-16 h-16 bg-surface rounded-lg flex items-center justify-center border border-outline-variant/10">
                  <span className="material-symbols-outlined text-outline text-[32px] opacity-80">{doc.documentType === "FINAL_REPORT" ? "stars" : "picture_as_pdf"}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-on-surface hover:text-primary-fixed transition-colors">
                         <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
                      </h3>
                      <p className="text-sm text-on-surface-variant">Submitted by <span className="text-inverse-surface">{doc.uploader.email.split('@')[0]}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-2">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">label</span> {doc.documentType.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Side Panel */}
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h3 className="text-lg font-semibold text-primary-fixed tracking-tight mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                Official Templates
              </h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/50 hover:bg-surface-container transition-colors group">
                  <span className="material-symbols-outlined text-tertiary-container group-hover:text-tertiary transition-colors">lab_profile</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-inverse-surface group-hover:text-primary-fixed transition-colors">Thesis Format Guideline</p>
                    <p className="text-xs text-on-surface-variant">DOCX • 142 KB</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/50 hover:bg-surface-container transition-colors group">
                  <span className="material-symbols-outlined text-tertiary-container group-hover:text-tertiary transition-colors">present_to_all</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-inverse-surface group-hover:text-primary-fixed transition-colors">Mid-Defense Presentation</p>
                    <p className="text-xs text-on-surface-variant">PPTX • 2.1 MB</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
