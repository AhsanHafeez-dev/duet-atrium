"use client";

import NotificationBell from "../ui/NotificationBell";

export default function TopNavBar() {
  return (
    <header className="sticky top-0 h-16 bg-surface/80 backdrop-blur-md border-b border-[#222a3d] flex items-center justify-between px-6 z-30 ml-0 md:ml-72">
      <div className="flex-1 flex items-center max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search proposals, faculty..."
            className="w-full bg-surface-container-high text-on-surface placeholder:text-outline border border-[#2d3449] focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-12 pr-4 py-2 text-sm transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <NotificationBell />
        <button className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center border border-[#3e495d] cursor-pointer hover:bg-[#4a576e] transition-colors overflow-hidden">
           <span className="material-symbols-outlined text-sm">person</span>
        </div>
      </div>
    </header>
  );
}
