"use client";

import { Search, Bell, Check, Menu, HelpCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Logic to determine page title based on route
  let pageTitle = "Guest Management";
  if (pathname === "/dashboard") pageTitle = "Dashboard";
  if (pathname === "/calendar") pageTitle = "Calendar";
  if (pathname === "/settings") pageTitle = "Settings";
  if (pathname === "/guests/new") pageTitle = "Add Guest";
  if (pathname?.startsWith("/guests/")) pageTitle = "Guest Details";


  return (
    <header className="h-20 bg-white border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 md:hidden">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg md:hidden text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative w-96 hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[#E2E8F0] rounded-lg leading-5 bg-[#F8FAFC] placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] sm:text-sm transition-colors"
            placeholder="Search guests, bookings..."
          />
        </div>
      </div>

      <div className="hidden sm:flex flex-1 justify-center">
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
      </div>

      <div className="flex items-center justify-end flex-1 gap-2 md:gap-4 text-gray-500">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-2 py-1 rounded-md">{unreadCount} Unread</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 italic">No notifications yet.</div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          router.push(`/guests/${n.guestId}`);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                              {n.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-800 font-medium mb-1 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                          {!n.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="p-1 hover:bg-white rounded text-[#1E3A8A]"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-[#F8FAFC] text-center border-t border-[#E2E8F0]">
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-gray-500 hover:text-[#1E3A8A] transition-colors"
                >
                  Clear All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
