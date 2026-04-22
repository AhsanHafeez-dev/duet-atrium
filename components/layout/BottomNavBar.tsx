"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavBar({ role }: { role: string }) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "STUDENT":
        return [
          { href: "/dashboard", icon: "dashboard" },
          { href: "/groups", icon: "group" },
          { href: "/faculty", icon: "contact_page" },
          { href: "/proposals", icon: "description" },
          { href: "/documents", icon: "folder" },
        ];
      case "TEACHER":
        return [
          { href: "/dashboard", icon: "dashboard" },
          { href: "/supervised-groups", icon: "group" },
          { href: "/proposals", icon: "description" },
          { href: "/documents", icon: "folder" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low border-t border-[#222a3d] flex items-center justify-around px-2 z-40 pb-safe">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
              isActive ? "bg-surface-bright text-primary" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
