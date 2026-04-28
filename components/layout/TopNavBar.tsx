"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "../ui/NotificationBell";

export default function TopNavBar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/faculty?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 h-16 bg-surface/80 backdrop-blur-md border-b border-[#222a3d] flex items-center justify-between px-6 z-30 ml-0 md:ml-72">
      <form onSubmit={handleSearch} className="flex-1 flex items-center max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search faculty, experts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high text-on-surface placeholder:text-outline border border-[#2d3449] focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-12 pr-4 py-2 text-sm transition-all outline-none"
          />
        </div>
      </form>
      
      <div className="flex items-center gap-4 ml-4">
        <NotificationBell />
        <Link href="https://github.com/AhsanHafeez-dev/duet-atrium" target="_blank" className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">help</span>
        </Link>
        
        <div className="relative" ref={menuRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center border border-[#3e495d] cursor-pointer hover:bg-[#4a576e] transition-colors overflow-hidden"
          >
             {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <span className="material-symbols-outlined text-sm">person</span>
             )}
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-highest border border-[#3e495d] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
               <div className="px-4 py-3 border-b border-[#3e495d]/50">
                  <p className="text-sm font-bold text-on-surface truncate">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{user?.role}</p>
               </div>
               <Link href="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Settings
               </Link>
               <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
               >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
