"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Guest List", href: "/guests", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 border-r border-[#E2E8F0] bg-[#F8FAFC] flex flex-col hidden md:flex flex-shrink-0 h-screen sticky top-0">
      <div className="p-6">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Orélia</h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Active if it exactly matches, or if it's guests and starts with it (for child routes like [id])
            const isActive =
              pathname === item.href ||
              (item.href === "/guests" && pathname?.startsWith("/guests") && pathname !== "/guests/new") ||
              (item.href === "/guests/new" && pathname === "/guests/new");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-[#1E3A8A] shadow-sm border border-[#E2E8F0]"
                    : "text-gray-600 hover:bg-white hover:text-[#1E3A8A]"
                }`}
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
        <div className="flex items-center gap-3 px-2 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative border border-gray-300">
            {/* Dummy placeholder for user profile */}
            <div className="absolute inset-0 bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm">
              MP
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">
              Manager Profile
            </p>
            <p className="text-xs text-gray-500">View Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
