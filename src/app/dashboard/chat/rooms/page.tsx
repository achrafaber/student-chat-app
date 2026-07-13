"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isPrivate: boolean;
  joinCode: string | null;
  memberCount: number;
  lastMessageAt: string;
  isMember: boolean;
}

const categoryIcons: Record<string, string> = {
  general: "💬", study: "📚", fun: "🎮", tech: "💻", culture: "☕", sports: "⚽",
};

const categoryLabels: Record<string, string> = {
  general: "Général", study: "Études", fun: "Fun", tech: "Tech", culture: "Culture", sports: "Sport",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", icon: "💬", category: "general", isPrivate: false, joinCode: "" });

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms", { credentials: "same-origin" });
      const data = await res.json();
      setRooms(data.rooms || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
        credentials: "same-origin",
      });
      if (res.ok) {
        setShowCreate(false);
        setNewRoom({ name: "", description: "", icon: "💬", category: "general", isPrivate: false, joinCode: "" });
        fetchRooms();
      }
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === "all" ? rooms : rooms.filter((r) => r.category === filter);
  const categories = ["all", ...new Set(rooms.map((r) => r.category))];

  const iconOptions = ["💬", "📚", "💻", "☕", "⚽", "🎮", "🎵", "🎯", "🌍", "🔥", "💡", "🚀", "🎬", "📷", "🎪", "🌈"];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">💬 Salons de discussion</h1>
          <p className="text-retro-text-dim text-sm mt-1">Rejoignez un salon ou créez le vôtre</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 transition-all"
        >
          {showCreate ? "Annuler" : "+ Créer un salon"}
        </button>
      </div>

      {/* Create room form */}
      {showCreate && (
        <div className="glass-surface rounded-2xl p-6 glow-border animate-slide-up">
          <h3 className="font-semibold mb-4">🆕 Nouveau salon</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">Icône</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, icon })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                      newRoom.icon === icon
                        ? "bg-neon-purple/20 border border-neon-purple/50"
                        : "bg-retro-dark border border-retro-border hover:border-neon-purple/30"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-retro-text-dim mb-2">Nom du salon</label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="Mon super salon"
                  className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-retro-text-dim mb-2">Catégorie</label>
                <select
                  value={newRoom.category}
                  onChange={(e) => setNewRoom({ ...newRoom, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text focus:outline-none focus:border-neon-purple transition-all"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{categoryIcons[k]} {v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">Description</label>
              <input
                type="text"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                placeholder="De quoi on discute ici ?"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {creating ? "Création..." : "Créer le salon ✨"}
            </button>
          </form>
          {/* Private room option */}
          <div className="mt-4 pt-4 border-t border-retro-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={newRoom.isPrivate} onChange={(e) => setNewRoom({ ...newRoom, isPrivate: e.target.checked })}
                className="w-4 h-4 rounded accent-neon-purple" />
              <span className="text-sm font-medium">🔒 Salon privé avec code</span>
            </label>
            {newRoom.isPrivate && (
              <div className="mt-3">
                <label className="block text-sm text-retro-text-dim mb-1">Code d&apos;accès</label>
                <input type="text" value={newRoom.joinCode} onChange={(e) => setNewRoom({ ...newRoom, joinCode: e.target.value })}
                  placeholder="Ex: SECRET123" className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all" />
                <p className="text-[10px] text-retro-text-dim mt-1">Les membres devront entrer ce code pour rejoindre</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === cat
                ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                : "bg-retro-surface border border-retro-border text-retro-text-dim hover:text-retro-text"
            }`}
          >
            {cat === "all" ? "🌟 Tous" : `${categoryIcons[cat] || "📁"} ${categoryLabels[cat] || cat}`}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-retro-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center animate-slide-up">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold mb-2">Aucun salon trouvé</h3>
          <p className="text-retro-text-dim text-sm mb-4">
            {filter !== "all" ? "Essayez une autre catégorie ou" : "Soyez le premier à"} créer un salon !
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            Créer un salon 💬
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {filtered.map((room) => (
            <Link
              key={room.id}
              href={`/dashboard/chat/rooms/${room.id}`}
              className="glass-surface rounded-xl p-5 hover:border-neon-purple/30 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-retro-surface-2 flex items-center justify-center text-2xl shrink-0">
                  {room.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm group-hover:text-neon-purple transition-colors truncate">
                      {room.name}
                    </h3>
                    {room.isMember && (
                      <span className="px-1.5 py-0.5 rounded-md bg-neon-green/10 text-neon-green text-[10px] font-bold shrink-0">
                        REJOINT
                      </span>
                    )}
                    {room.isPrivate && (
                      <span className="px-1.5 py-0.5 rounded-md bg-neon-yellow/10 text-neon-yellow text-[10px] font-bold shrink-0">
                        🔒 PRIVÉ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-retro-text-dim truncate mt-0.5">{room.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-retro-text-dim">👥 {room.memberCount}</span>
                  <span className="text-xs text-retro-text-dim">
                    🏷️ {categoryLabels[room.category] || room.category}
                  </span>
                </div>
                <span className="text-xs text-neon-purple opacity-0 group-hover:opacity-100 transition-opacity">
                  Entrer →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
