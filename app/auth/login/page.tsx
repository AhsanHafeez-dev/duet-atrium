"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [view, setView] = useState<"EMAIL" | "OTP" | "PASSWORD">("EMAIL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Focus management for OTP
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
         prevInput.focus();
         setTimeout(() => {
           const newOtp = [...otp];
           newOtp[index - 1] = "";
           setOtp(newOtp);
         }, 0);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your academic email");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.status === 409) {
         setView("PASSWORD");
      } else if (res.ok) {
         setView("OTP");
      } else {
         setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
       setError("Please enter the 6-digit OTP");
       return;
    }
    
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();
      
      if (res.ok) {
         localStorage.setItem("access_token", data.accessToken);
         localStorage.setItem("refresh_token", data.refreshToken);
         if (data.user?.role) localStorage.setItem("user_role", data.user.role);
         
         window.location.href = data.redirect;
      } else {
         setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
         localStorage.setItem("access_token", data.accessToken);
         localStorage.setItem("refresh_token", data.refreshToken);
         if (data.user?.role) localStorage.setItem("user_role", data.user.role);
         
         window.location.href = data.redirect;
      } else {
         setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-tertiary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-md bg-surface-container-low border border-[#222a3d] p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 ambient-shadow max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary mx-auto flex items-center justify-center rounded-xl mb-4 border border-primary/20">
             <span className="text-3xl font-bold leading-none tracking-tighter">D</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">DUET Atrium</h1>
          <p className="text-on-surface-variant text-sm">Academic Portal Workspace</p>
        </div>

        {error && (
           <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium border border-error-container/50">
              {error}
           </div>
        )}

        {view === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2 ml-1">
                Academic Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@students.duet.edu.pk"
                  className="w-full h-12 bg-surface-container-highest text-on-surface placeholder:text-outline border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-11 pr-4 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                 <>
                   Continue
                   <span className="material-symbols-outlined text-lg">arrow_forward</span>
                 </>
              )}
            </button>
          </form>
        )}

        {view === "PASSWORD" && (
          <form onSubmit={handleLoginPW} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                 <label className="text-sm font-medium text-on-surface-variant">
                   Password
                 </label>
                 <button type="button" onClick={() => setView("EMAIL")} className="text-xs text-primary hover:underline">Change Email</button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-surface-container-highest text-on-surface placeholder:text-outline border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-11 pr-4 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        )}

        {view === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center mb-2">
                <p className="text-on-surface-variant text-sm">
                   We sent a 6-digit code to <br/><strong className="text-on-surface">{email}</strong>
                </p>
             </div>
             
             <div className="flex justify-center gap-2 sm:gap-3">
               {otp.map((digit, index) => (
                 <input
                   key={index}
                   id={`otp-${index}`}
                   type="text"
                   inputMode="numeric"
                   maxLength={1}
                   value={digit}
                   onChange={(e) => handleOtpChange(index, e.target.value)}
                   onKeyDown={(e) => handleOtpKeyDown(index, e)}
                   className="w-12 h-14 sm:w-14 sm:h-16 bg-surface-container-highest text-on-surface text-center text-xl font-bold border border-[#3e495d] focus:border-primary focus:ring-1 focus:ring-primary rounded-xl transition-all"
                   autoFocus={index === 0}
                 />
               ))}
             </div>

             <div className="flex justify-between items-center text-sm px-1">
                <button type="button" onClick={() => setView("EMAIL")} className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors">
                   <span className="material-symbols-outlined text-sm">arrow_back</span>
                   Back
                </button>
                <button type="button" className="text-primary hover:text-primary-container font-medium transition-colors">
                   Resend Code
                </button>
             </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                 <>
                   Verify <span className="material-symbols-outlined text-lg">verified_user</span>
                 </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
