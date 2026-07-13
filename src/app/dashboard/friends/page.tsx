"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/fetch";

interface Friend {
  id: string;
  friendId: string;
  userId: string;
  friendName: string;
  friendAvatarColor: string;
  friendMassarCode: string;
  friendStatus: string;
}

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  userMassarCode: string;
  createdAt: string;
}

interface PendingSent {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatarColor: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  massarCode: string;
  avatarColor: string;
  status: string;
  bio: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch("/api/friends");
      const data = await res.json();
      setFriends(data.friends || []);
      setPendingReceived(data.pendingReceived || []);
      setPendingSent(data.pendingSent || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiFetch(`/api/users?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const res = await apiFetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // Silent fail
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiFetch(`/api/friends/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      fetchData();
    } catch {
      // Silent fail
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiFetch(`/api/friends/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      fetchData();
    } catch {
      // Silent fail
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await apiFetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      fetchData();
    } catch {
      // Silent fail
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some((f) => f.friendId === userId || f.userId === userId);
  };

  const isPendingSent = (userId: string) => {
    return pendingSent.some((p) => p.friendId === userId);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-retro-surface-2 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold">👥 Amis</h1>
        <p className="text-retro-text-dim text-sm mt-1">Gérez vos amitiés et rencontres</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {[
          { key: "friends" as const, label: `Amis (${friends.length})`, icon: "👥" },
          { key: "requests" as const, label: `Demandes (${pendingReceived.length})`, icon: "📨" },
          { key: "search" as const, label: "Rechercher", icon: "🔍" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                : "bg-retro-surface border border-retro-border text-retro-text-dim hover:text-retro-text"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === "friends" && (
        <div className="space-y-2 animate-fade-in">
          {friends.length === 0 ? (
            <div className="glass-surface rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold mb-2">Pas encore d&apos;amis</h3>
              <p className="text-retro-text-dim text-sm mb-4">Recherchez des étudiants et ajoutez-les en ami !</p>
              <button
                onClick={() => setTab("search")}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                Rechercher des amis 🔍
              </button>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="glass-surface rounded-xl p-4 flex items-center gap-4 group"
              >
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: friend.friendAvatarColor || "#8B5CF6" }}
                  >
                    {friend.friendName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-retro-surface status-${friend.friendStatus}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-neon-purple transition-colors truncate">
                    {friend.friendName}
                  </p>
                  <p className="text-xs text-retro-text-dim">{friend.friendMassarCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/chat/private/${friend.friendId}`}
                    className="px-3 py-2 rounded-lg bg-neon-purple/10 text-neon-purple text-xs font-medium hover:bg-neon-purple/20 transition-all"
                  >
                    💬 Message
                  </Link>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="px-3 py-2 rounded-lg bg-retro-dark border border-retro-border text-retro-text-dim text-xs hover:text-red-400 hover:border-red-400/30 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              📨 Demandes reçues
              {pendingReceived.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink text-xs font-bold">
                  {pendingReceived.length}
                </span>
              )}
            </h3>
            {pendingReceived.length === 0 ? (
              <div className="glass-surface rounded-xl p-6 text-center">
                <p className="text-retro-text-dim text-sm">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="glass-surface rounded-xl p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: req.userAvatarColor || "#8B5CF6" }}
                    >
                      {req.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{req.userName}</p>
                      <p className="text-xs text-retro-text-dim">{req.userMassarCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-3 py-2 rounded-lg bg-neon-green/10 text-neon-green text-xs font-medium hover:bg-neon-green/20 transition-all"
                      >
                        ✓ Accepter
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                      >
                        ✕ Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3">📤 Demandes envoyées</h3>
            {pendingSent.length === 0 ? (
              <div className="glass-surface rounded-xl p-6 text-center">
                <p className="text-retro-text-dim text-sm">Aucune demande envoyée en attente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSent.map((req) => (
                  <div key={req.id} className="glass-surface rounded-xl p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: req.friendAvatarColor || "#8B5CF6" }}
                    >
                      {req.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{req.friendName}</p>
                      <p className="text-xs text-retro-text-dim">En attente de réponse...</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-neon-yellow/10 text-neon-yellow text-xs font-medium">
                      ⏳ En attente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search tab */}
      {tab === "search" && (
        <div className="space-y-4 animate-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom ou Code Massar..."
            className="w-full px-4 py-3 rounded-xl bg-retro-surface border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
          />

          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
                <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
                <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
              </div>
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="glass-surface rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-retro-text-dim">Aucun résultat pour &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="glass-surface rounded-xl p-4 flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.avatarColor || "#8B5CF6" }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-retro-surface status-${user.status}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-retro-text-dim">{user.massarCode}</p>
                  {user.bio && <p className="text-xs text-retro-text-dim truncate mt-0.5">{user.bio}</p>}
                </div>
                <div>
                  {isAlreadyFriend(user.id) ? (
                    <span className="px-3 py-2 rounded-lg bg-neon-green/10 text-neon-green text-xs font-medium">
                      ✓ Ami
                    </span>
                  ) : isPendingSent(user.id) ? (
                    <span className="px-3 py-2 rounded-lg bg-neon-yellow/10 text-neon-yellow text-xs font-medium">
                      ⏳ Envoyé
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="px-3 py-2 rounded-lg bg-neon-purple/10 text-neon-purple text-xs font-medium hover:bg-neon-purple/20 transition-all"
                    >
                      + Ajouter
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
