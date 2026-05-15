"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Settings, Bell, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Guest List", href: "/guests", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<any>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const unread = data.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchSettings();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchSettings();
    }, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    ...navItems,
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  const sidebarContent = (
    <>
      <div className="p-6">
        <div className="mb-10 px-2 flex flex-col items-center justify-center relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute right-0 top-0 p-2 md:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          {settings?.companyLogo ? (
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex-shrink-0 transition-transform hover:scale-105 duration-300">
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-28 h-28 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white font-black text-4xl flex-shrink-0 shadow-2xl shadow-blue-900/40 transition-transform hover:scale-105 duration-300">
              {settings?.companyName?.charAt(0) || "O"}
            </div>
          )}
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/guests" && pathname?.startsWith("/guests") && pathname !== "/guests/new" && pathname !== "/guests/settings") ||
              (item.href === "/settings" && pathname === "/settings");

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-[#1E3A8A] shadow-sm border border-[#E2E8F0]"
                    : "text-gray-600 hover:bg-white hover:text-[#1E3A8A]"
                } ${item.name === "Notifications" ? "hidden md:flex" : "flex"}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-[#1E3A8A]" : "text-gray-400"}`} />
                    {item.name}
                  </div>
                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-[#E2E8F0]">
        <Link 
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
        >
          <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
          Logout
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-[#E2E8F0] bg-[#F8FAFC] flex flex-col hidden md:flex flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#F8FAFC] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
