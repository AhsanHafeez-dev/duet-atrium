"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNavBar({ role }: { role: string }) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "STUDENT":
        return [
          { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
          { href: "/groups", label: "My Group", icon: "group" },
          { href: "/faculty", label: "Faculty Directory", icon: "contact_page" },
          { href: "/proposals", label: "Proposal", icon: "description" },
          { href: "/documents", label: "Documents", icon: "folder" },
        ];
      case "TEACHER":
        return [
          { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
          { href: "/supervised-groups", label: "Supervised Groups", icon: "group" },
          { href: "/proposals", label: "Proposals", icon: "description" },
          { href: "/documents", label: "Documents", icon: "folder" },
          { href: "/announcements", label: "Announcements", icon: "campaign" },
        ];
      case "ADMIN":
         return [
           { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
           { href: "/admin/users", label: "Manage Users", icon: "manage_accounts" },
           { href: "/admin/proposals", label: "All Proposals", icon: "description" },
           { href: "/admin/settings", label: "Portal Settings", icon: "settings" },
         ]
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <nav className="fixed left-0 top-0 h-screen w-72 bg-surface-container-low border-r border-[#222a3d] hidden md:flex flex-col z-40 p-4">
      <div className="flex items-center gap-3 mb-10 px-4 mt-2">
        <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-bold text-lg leading-none">
          D
        </div>
        <div>
          <h1 className="text-primary font-bold text-lg leading-tight tracking-tight">DUET Atrium</h1>
          <p className="text-on-surface-variant text-xs">FYP Management</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-r-full transition-all duration-200 ${
                isActive
                  ? "bg-surface-bright text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                {link.icon}
              </span>
              <span className={`font-medium ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-4 mb-4">
        <Link
          href="/settings"
          className="flex items-center gap-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium">Settings</span>
        </Link>
         <button
            onClick={async () => {
              const token = localStorage.getItem("access_token");
              await fetch('/api/auth/logout', { 
                 method: 'POST',
                 headers: { "Authorization": `Bearer ${token}` }
              });
              localStorage.clear();
              window.location.href = '/auth/login';
            }}
            className="flex items-center gap-4 py-3 text-on-surface-variant hover:text-error transition-colors w-full text-left"
         >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
