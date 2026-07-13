"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  massarCode: string;
  name: string;
  email: string;
  avatarColor: string;
  bio: string;
  status: string;
  lastSeen: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    online: { label: "En ligne", color: "neon-green", icon: "🟢" },
    away: { label: "Absent", color: "neon-yellow", icon: "🟡" },
    offline: { label: "Hors ligne", color: "gray-400", icon: "⚫" },
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-40 bg-retro-surface-2 rounded-2xl animate-pulse" />
        <div className="h-60 bg-retro-surface-2 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const statusInfo = statusLabels[user.status] || statusLabels.offline;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="glass-surface rounded-2xl overflow-hidden animate-slide-up">
        <div
          className="h-32"
          style={{
            background: `linear-gradient(135deg, ${user.avatarColor}40 0%, ${user.avatarColor}20 50%, #1A1128 100%)`,
          }}
        />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-retro-surface"
                style={{ backgroundColor: user.avatarColor || "#8B5CF6" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-retro-surface status-${user.status}`} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold truncate">{user.name}</h1>
              <p className="text-sm text-retro-text-dim">{user.massarCode}</p>
            </div>
            <Link
              href="/dashboard/profile/settings"
              className="px-4 py-2 rounded-xl bg-neon-purple/10 text-neon-purple text-sm font-medium hover:bg-neon-purple/20 transition-all shrink-0"
            >
              ⚙️ Modifier
            </Link>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {/* Status */}
        <div className="glass-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold text-retro-text-dim mb-3">📊 Statut</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg">{statusInfo.icon}</span>
            <span className={`font-medium text-${statusInfo.color}`}>{statusInfo.label}</span>
            {user.lastSeen && (
              <span className="text-xs text-retro-text-dim ml-auto">
                Dernière connexion : {formatDate(user.lastSeen)}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="glass-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold text-retro-text-dim mb-3">📝 Bio</h3>
          <p className="text-sm">{user.bio || "Aucune bio pour le moment..."}</p>
        </div>

        {/* Details */}
        <div className="glass-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold text-retro-text-dim mb-3">📋 Informations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-retro-text-dim">Code Massar</span>
              <span className="text-sm font-mono font-medium">{user.massarCode}</span>
            </div>
            <div className="h-px bg-retro-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-retro-text-dim">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="h-px bg-retro-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-retro-text-dim">Membre depuis</span>
              <span className="text-sm">{formatDate(user.createdAt)}</span>
            </div>
            <div className="h-px bg-retro-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-retro-text-dim">Couleur avatar</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md"
                  style={{ backgroundColor: user.avatarColor }}
                />
                <span className="text-sm font-mono">{user.avatarColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
