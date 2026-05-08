"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Calendar, User, ExternalLink, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with guest activities and system alerts</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E3A8A] hover:bg-blue-50 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-2xl border border-[#E2E8F0]">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0] text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] text-gray-300 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-500 mt-1">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer ${
                !n.isRead ? 'border-blue-200 shadow-sm shadow-blue-900/5 ring-1 ring-blue-50' : 'border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2.5 rounded-xl ${
                  n.type.includes('CHECKIN') ? 'bg-amber-50 text-amber-600' :
                  n.type.includes('CHECKED_IN') ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {n.type.includes('CHECKIN') ? <Mail className="w-5 h-5" /> : 
                   n.type.includes('CHECKED_IN') ? <User className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {n.type.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{n.message}</h4>
                  <div className="flex items-center gap-4 mt-3">
                    <Link 
                      href={`/guests/${n.guestId}`}
                      className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1 hover:underline"
                    >
                      View Guest Record <ExternalLink className="w-3 h-3" />
                    </Link>
                    {!n.isRead && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        New Notification
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
