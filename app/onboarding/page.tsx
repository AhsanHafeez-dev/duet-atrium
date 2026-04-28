"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  // State
  const [password, setPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Student
  const [rollNumber, setRollNumber] = useState("");
  const [batch, setBatch] = useState("Fall 2022");
  const [program, setProgram] = useState("BSCS");

  // Teacher
  const [designation, setDesignation] = useState("Assistant Professor");
  const [domainTagsStr, setDomainTagsStr] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
     const token = localStorage.getItem("access_token");
     fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
     }).then(res => res.json()).then(data => {
        if (data.user?.role) setRole(data.user.role);
     }).catch(() => {});
  }, []);

  const uploadFileToCloudinary = async (file: File) => {
     const token = localStorage.getItem("access_token");
     const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ folder: "profiles" })
     });
     const signData = await signRes.json();
     if (!signRes.ok) throw new Error("Failed to get upload signature");

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

    try {
      const token = localStorage.getItem("access_token");
      
      let profileImageUrl = null;
      if (profileImageFile) {
         profileImageUrl = await uploadFileToCloudinary(profileImageFile);
      }

      const payload = role === "STUDENT" 
         ? { password, rollNumber, batch, program, profileImageUrl } 
         : { password, designation, bio, domainTags: domainTagsStr.split(",").map(t => t.trim()), profileImageUrl };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
         router.push(json.redirect);
      } else {
         setError(json.error || "Failed to save profile");
      }
    } catch (err: any) {
       setError(err.message || "Network error");
    } finally {
       setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        setProfileImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
     }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
       {/* Background Orbs */}
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="w-full max-w-lg bg-surface-container-low border border-[#222a3d] p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 ambient-shadow">
          <div className="mb-8">
             <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Complete your profile</h1>
             <p className="text-on-surface-variant text-sm">Please set your password and provide academic details.</p>
          </div>

          {error && (
             <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium border border-error-container/50">
                {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest border-2 border-[#3e495d] mb-4 flex items-center justify-center relative cursor-pointer hover:border-primary transition-colors">
                   {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                   )}
                   <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                </div>
                <label className="text-sm text-primary font-medium">Upload Profile Picture</label>
             </div>

             <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">New Password</label>
                <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                   required
                   minLength={6}
                />
             </div>

             {role === "STUDENT" ? (
                <>
                   <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Roll Number</label>
                      <input
                         type="text"
                         value={rollNumber}
                         onChange={(e) => setRollNumber(e.target.value)}
                         className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                         required
                         placeholder="e.g. 22F-BSCS-19"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Batch</label>
                         <input
                            type="text"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                            className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                            required
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Program</label>
                         <select
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                            className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                         >
                            <option>BSCS</option>
                            <option>BSIT</option>
                            <option>BSCY</option>
                            <option>BSAI</option>
                            <option>BSDS</option>
                         </select>
                      </div>
                   </div>
                </>
             ) : (
                <>
                   <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Designation</label>
                      <select
                         value={designation}
                         onChange={(e) => setDesignation(e.target.value)}
                         className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                      >
                         <option>Lecturer</option>
                         <option>Assistant Professor</option>
                         <option>Associate Professor</option>
                         <option>Professor</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Domain Expertise Tags (Comma separated)</label>
                      <input
                         type="text"
                         value={domainTagsStr}
                         onChange={(e) => setDomainTagsStr(e.target.value)}
                         className="w-full h-12 bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4"
                         placeholder="Machine Learning, IoT, Web Dev"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">Short Bio</label>
                      <textarea
                         value={bio}
                         onChange={(e) => setBio(e.target.value)}
                         className="w-full bg-surface-container-highest text-on-surface border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 min-h-24"
                         placeholder="A brief bio..."
                      ></textarea>
                   </div>
                </>
             )}

             <button
               type="submit"
               disabled={loading}
               className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50"
             >
               {loading ? "Saving..." : "Complete Profile"}
             </button>
          </form>
       </div>
    </div>
  );
}
