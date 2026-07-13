"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User { id: string; name: string; massarCode: string; avatarColor: string; status: string; }
interface Room { id: string; name: string; description: string; icon: string; category: string; memberCount: number; lastMessageAt: string; isMember: boolean; }
interface Conversation { partnerId: string; partnerName: string; partnerAvatarColor: string; lastMessage: string; lastMessageAt: string; unread: number; }

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/messages/private", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/users", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([roomsData, msgsData, usersData]) => {
        setRooms(roomsData.rooms || []);
        setConversations(msgsData.conversations || []);
        setOnlineUsers((usersData.users || []).filter((u: User) => u.status === "online"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-retro-surface-2 rounded-lg w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-32 bg-retro-surface-2 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const popularRooms = [...rooms].sort((a, b) => b.memberCount - a.memberCount).slice(0, 4);
  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="glass-surface rounded-2xl p-6 glow-border animate-slide-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Bienvenue sur <span className="neon-text">MassarChat</span> ✨
            </h1>
            <p className="text-retro-text-dim">
              Connectez-vous avec vos camarades, rejoignez des salons et discutez en temps réel !
            </p>
          </div>
          <Link
            href="/dashboard/chat/rooms"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 transition-all whitespace-nowrap"
          >
            Rejoindre un salon 💬
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {[
          { label: "Salons", value: rooms.length, icon: "💬", color: "neon-purple" },
          { label: "En ligne", value: onlineUsers.length, icon: "🟢", color: "neon-green" },
          { label: "Conversations", value: conversations.length, icon: "✉️", color: "neon-cyan" },
          { label: "Membres", value: rooms.reduce((a, r) => a + r.memberCount, 0), icon: "👥", color: "neon-yellow" },
        ].map((stat) => (
          <div key={stat.label} className="glass-surface rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-retro-text-dim">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Popular rooms */}
      <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">🔥 Salons populaires</h2>
          <Link href="/dashboard/chat/rooms" className="text-sm text-neon-purple hover:text-neon-cyan transition-colors">
            Voir tout →
          </Link>
        </div>

        {popularRooms.length === 0 ? (
          <div className="glass-surface rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-retro-text-dim">Aucun salon disponible</p>
            <Link href="/dashboard/chat/rooms" className="text-neon-purple text-sm mt-2 inline-block hover:text-neon-cyan">
              Créer un salon →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularRooms.map((room) => (
              <Link
                key={room.id}
                href={`/dashboard/chat/rooms/${room.id}`}
                className="glass-surface rounded-xl p-4 hover:border-neon-purple/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-retro-surface-2 flex items-center justify-center text-2xl">
                    {room.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm group-hover:text-neon-purple transition-colors truncate">
                        {room.name}
                      </h3>
                      {room.isMember && (
                        <span className="px-1.5 py-0.5 rounded-md bg-neon-green/10 text-neon-green text-[10px] font-bold">
                          REJOINT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-retro-text-dim truncate mt-0.5">{room.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-retro-text-dim">👥 {room.memberCount}</span>
                      <span className="text-xs text-retro-text-dim">
                        🏷️ {room.category}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent conversations */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">✉️ Messages récents</h2>
          <Link href="/dashboard/chat/private" className="text-sm text-neon-purple hover:text-neon-cyan transition-colors">
            Voir tout →
          </Link>
        </div>

        {recentConversations.length === 0 ? (
          <div className="glass-surface rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-retro-text-dim">Aucune conversation pour le moment</p>
            <Link href="/dashboard/friends" className="text-neon-purple text-sm mt-2 inline-block hover:text-neon-cyan">
              Trouver des amis →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentConversations.map((conv) => (
              <Link
                key={conv.partnerId}
                href={`/dashboard/chat/private/${conv.partnerId}`}
                className="glass-surface rounded-xl p-4 hover:border-neon-purple/30 transition-all flex items-center gap-3 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm relative"
                  style={{ backgroundColor: conv.partnerAvatarColor || "#8B5CF6" }}
                >
                  {conv.partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-neon-purple transition-colors truncate">
                    {conv.partnerName}
                  </p>
                  <p className="text-xs text-retro-text-dim truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink text-xs font-bold">
                    {conv.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Online users */}
      {onlineUsers.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-lg font-semibold mb-4">🟢 En ligne maintenant</h2>
          <div className="flex flex-wrap gap-3">
            {onlineUsers.slice(0, 8).map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/chat/private/${u.id}`}
                className="glass-surface rounded-xl px-3 py-2 hover:border-neon-purple/30 transition-all flex items-center gap-2 group"
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: u.avatarColor || "#8B5CF6" }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-retro-surface status-online" />
                </div>
                <span className="text-xs font-medium group-hover:text-neon-purple transition-colors">
                  {u.name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
