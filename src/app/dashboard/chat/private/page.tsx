"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/fetch";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatarColor: string;
  partnerMassarCode: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface User {
  id: string;
  name: string;
  massarCode: string;
  avatarColor: string;
  status: string;
}

export default function PrivateMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/messages/private").then((r) => r.json()),
      apiFetch("/api/users").then((r) => r.json()),
    ])
      .then(([msgsData, usersData]) => {
        setConversations(msgsData.conversations || []);
        setUsers(usersData.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">✉️ Messages privés</h1>
          <p className="text-retro-text-dim text-sm mt-1">Vos conversations privées</p>
        </div>
        <button
          onClick={() => setShowNewMessage(!showNewMessage)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 transition-all"
        >
          {showNewMessage ? "Annuler" : "+ Nouveau message"}
        </button>
      </div>

      {/* New message - user selection */}
      {showNewMessage && (
        <div className="glass-surface rounded-2xl p-6 glow-border animate-slide-up">
          <h3 className="font-semibold mb-4">👤 Démarrer une conversation</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-retro-text-dim text-sm text-center py-4">Aucun utilisateur trouvé</p>
            ) : (
              users.map((u) => (
                <Link
                  key={u.id}
                  href={`/dashboard/chat/private/${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-retro-surface-2 transition-all group"
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: u.avatarColor || "#8B5CF6" }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-retro-surface status-${u.status}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-neon-purple transition-colors">{u.name}</p>
                    <p className="text-xs text-retro-text-dim">{u.massarCode}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher une conversation..."
          className="w-full px-4 py-3 rounded-xl bg-retro-surface border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
        />
      </div>

      {/* Conversations */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-retro-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
          <p className="text-retro-text-dim text-sm mb-4">
            {search ? "Aucun résultat pour votre recherche" : "Commencez une conversation avec un ami !"}
          </p>
          {!search && (
            <button
              onClick={() => setShowNewMessage(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              Nouveau message ✉️
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {filteredConversations.map((conv) => (
            <Link
              key={conv.partnerId}
              href={`/dashboard/chat/private/${conv.partnerId}`}
              className="glass-surface rounded-xl p-4 hover:border-neon-purple/30 transition-all flex items-center gap-4 group"
            >
              <div className="relative shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: conv.partnerAvatarColor || "#8B5CF6" }}
                >
                  {conv.partnerName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm group-hover:text-neon-purple transition-colors truncate">
                    {conv.partnerName}
                  </p>
                  <span className="text-xs text-retro-text-dim shrink-0 ml-2">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-retro-text-dim truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-neon-pink/20 text-neon-pink text-xs font-bold shrink-0">
                  {conv.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
