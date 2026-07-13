"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/fetch";

interface User {
  id: string;
  massarCode: string;
  name: string;
  email: string;
  avatarColor: string;
  bio: string;
  gender: string;
  status: string;
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

function genderColor(gender?: string, fallback?: string): string {
  if (gender === "female") return "#EC4899";
  if (gender === "male") return "#3B82F6";
  return fallback || "#8B5CF6";
}

export { genderColor };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadMail, setUnreadMail] = useState(0);

  const fetchUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) { window.location.href = "/login"; return; }
      const data = await res.json();
      setUser(data.user);
    } catch { window.location.href = "/login"; }
    finally { setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [friendsRes, messagesRes, mailRes] = await Promise.all([
        apiFetch("/api/friends"),
        apiFetch("/api/messages/private"),
        apiFetch("/api/mail"),
      ]);
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendRequests(friendsData.pendingReceived?.length || 0);
      }
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const total = (messagesData.conversations || []).reduce((acc: number, c: { unread?: number }) => acc + (c.unread || 0), 0);
        setUnreadMessages(total);
      }
      if (mailRes.ok) {
        const mailData = await mailRes.json();
        setUnreadMail(mailData.unreadCount || 0);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleLogout = async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch { /* */ }
    window.location.href = "/login";
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setUser({ ...user, status: newStatus });
    } catch { /* silent */ }
  };

  const navItems: NavItem[] = [
    { href: "/dashboard", icon: "🏠", label: "Accueil" },
    { href: "/dashboard/chat/rooms", icon: "💬", label: "Salons" },
    { href: "/dashboard/chat/private", icon: "✉️", label: "Messages", badge: unreadMessages || undefined },
    { href: "/dashboard/mail", icon: "📬", label: "Boîte mail", badge: unreadMail || undefined },
    { href: "/dashboard/friends", icon: "👥", label: "Amis", badge: friendRequests || undefined },
    { href: "/dashboard/profile", icon: "👤", label: "Profil" },
    { href: "/dashboard/profile/settings", icon: "⚙️", label: "Paramètres" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    online: { label: "En ligne", color: "neon-green", icon: "🟢" },
    busy: { label: "Occupé", color: "red-400", icon: "🔴" },
    away: { label: "Absent", color: "neon-yellow", icon: "🟡" },
    offline: { label: "Hors ligne", color: "gray-400", icon: "⚫" },
  };

  if (loading) {
    return (
      <div className="min-h-screen chat-gradient retro-grid flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-glow-pulse">💬</div>
          <h2 className="text-xl font-bold neon-text mb-2">MassarChat</h2>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
            <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
            <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const gc = genderColor(user.gender, user.avatarColor);

  return (
    <div className="min-h-screen chat-gradient flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-retro-surface border-r border-retro-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-retro-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-xl">💬</div>
            <div>
              <h1 className="font-bold text-lg neon-text">MassarChat</h1>
              <p className="text-xs text-retro-text-dim">Le chat des étudiants</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive(item.href) ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30" : "text-retro-text-dim hover:text-retro-text hover:bg-retro-surface-2"}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && item.badge > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink text-xs font-bold">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-retro-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm relative" style={{ backgroundColor: gc }}>
              {user.name.charAt(0).toUpperCase()}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-retro-surface status-${user.status}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: gc }}>{user.name}</p>
              <p className="text-xs text-retro-text-dim truncate">{user.massarCode}</p>
            </div>
          </div>

          {/* Status switcher */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            {Object.entries(statusLabels).map(([key, s]) => (
              <button key={key} onClick={() => handleStatusChange(key)} title={s.label}
                className={`p-1.5 rounded-lg text-center transition-all ${user.status === key ? "bg-retro-surface-2 border border-neon-purple/30" : "hover:bg-retro-surface-2"}`}>
                <span className="text-sm">{s.icon}</span>
              </button>
            ))}
          </div>

          <button onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-retro-dark border border-retro-border text-retro-text-dim hover:text-red-400 hover:border-red-400/30 text-sm transition-all">
            Déconnexion 👋
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen flex flex-col">
        <header className="h-14 bg-retro-surface/80 backdrop-blur-lg border-b border-retro-border flex items-center px-4 gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-retro-surface-2 text-retro-text-dim">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">{navItems.find((i) => isActive(i.href))?.label || "MassarChat"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {statusLabels[user.status] && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border`}>
                <span className="text-sm">{statusLabels[user.status].icon}</span>
                <span className="text-xs font-medium">{statusLabels[user.status].label}</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
