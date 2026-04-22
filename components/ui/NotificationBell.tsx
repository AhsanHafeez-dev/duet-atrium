"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchNotifications();
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className={`relative w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors group ${isOpen ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant'}`}
      >
        <span className={`material-symbols-outlined ${unreadCount > 0 ? 'group-hover:animate-[wiggle_0.5s_ease-in-out]' : ''}`}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-error text-[10px] font-bold text-on-error flex items-center justify-center rounded-full border-2 border-surface select-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[480px] bg-surface-container-highest border border-outline-variant rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest">
            <h3 className="font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
               <button 
                onClick={markAllAsRead}
                disabled={loading}
                className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary-container disabled:opacity-50"
               >
                 Mark all read
               </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-outline-variant/20">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 opacity-20">notifications_off</span>
                <p className="text-sm text-on-surface-variant">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors relative ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type.includes('ACCEPTED') ? 'bg-primary/20 text-primary' : 
                      (n.type.includes('REJECTED') ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary')
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {n.type.includes('PROPOSAL') ? 'description' : 'notifications'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface leading-snug mb-1">{n.message}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-surface-container-high/50 text-center border-t border-outline-variant/10 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
             End of list
          </div>
        </div>
      )}
    </div>
  );
}
