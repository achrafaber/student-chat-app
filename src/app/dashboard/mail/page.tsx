"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/fetch";
import { genderColor } from "../layout";

interface MailItem {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  body: string;
  read: boolean;
  starred: boolean;
  createdAt: string;
  senderName: string;
  senderAvatarColor: string;
  senderMassarCode: string;
}

interface User { id: string; name: string; massarCode: string; avatarColor: string; gender: string; status: string; }

export default function MailPage() {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MailItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ receiverId: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");

  const fetchData = useCallback(async () => {
    try {
      const [mailRes, usersRes] = await Promise.all([apiFetch("/api/mail"), apiFetch("/api/users")]);
      if (mailRes.ok) { const d = await mailRes.json(); setMails(d.mail || []); }
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users || []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkRead = async (id: string) => {
    await apiFetch(`/api/mail/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read" }) });
    fetchData();
  };

  const handleStar = async (id: string, starred: boolean) => {
    await apiFetch(`/api/mail/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: starred ? "unstar" : "star" }) });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/mail/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchData();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compose.receiverId || !compose.subject.trim() || !compose.body.trim()) return;
    setSending(true);
    try {
      await apiFetch("/api/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(compose) });
      setShowCompose(false);
      setCompose({ receiverId: "", subject: "", body: "" });
      fetchData();
    } finally { setSending(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const filtered = mails.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "starred") return m.starred;
    return true;
  });

  if (loading) return <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-retro-surface-2 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">📬 Boîte mail</h1>
          <p className="text-retro-text-dim text-sm mt-1">Votre messagerie intégrée</p>
        </div>
        <button onClick={() => setShowCompose(!showCompose)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 transition-all">
          {showCompose ? "Annuler" : "✉️ Nouveau mail"}
        </button>
      </div>

      {/* Compose form */}
      {showCompose && (
        <form onSubmit={handleSend} className="glass-surface rounded-2xl p-6 space-y-4 animate-slide-up glow-border">
          <h3 className="font-semibold">✉️ Nouveau message</h3>
          <div>
            <label className="block text-sm text-retro-text-dim mb-1">Destinataire</label>
            <select value={compose.receiverId} onChange={(e) => setCompose({ ...compose, receiverId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text focus:outline-none focus:border-neon-purple transition-all" required>
              <option value="">Sélectionner...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.massarCode})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-retro-text-dim mb-1">Sujet</label>
            <input type="text" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text focus:outline-none focus:border-neon-purple transition-all" required />
          </div>
          <div>
            <label className="block text-sm text-retro-text-dim mb-1">Message</label>
            <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} rows={5}
              className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text focus:outline-none focus:border-neon-purple transition-all resize-none" required />
          </div>
          <button type="submit" disabled={sending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all">
            {sending ? "Envoi..." : "Envoyer 📤"}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[{k:"all" as const,l:"Tous"},{k:"unread" as const,l:"Non lus"},{k:"starred" as const,l:"⭐ Favoris"}].map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter===f.k?"bg-neon-purple/20 text-neon-purple border border-neon-purple/30":"bg-retro-surface border border-retro-border text-retro-text-dim hover:text-retro-text"}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Mail list */}
        <div className={`space-y-2 ${selected ? "hidden md:block w-1/3" : "w-full"}`}>
          {filtered.length === 0 ? (
            <div className="glass-surface rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">Aucun mail</h3>
              <p className="text-retro-text-dim text-sm">{filter !== "all" ? "Aucun mail dans cette catégorie" : "Votre boîte est vide"}</p>
            </div>
          ) : filtered.map((m) => (
            <div key={m.id} onClick={() => { setSelected(m); if (!m.read) handleMarkRead(m.id); }}
              className={`glass-surface rounded-xl p-4 cursor-pointer transition-all hover:border-neon-purple/30 ${!m.read ? "border-l-2 border-l-neon-purple" : ""} ${selected?.id === m.id ? "border-neon-purple/50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: genderColor(m.senderMassarCode.includes("0") ? undefined : undefined, m.senderAvatarColor) }}>
                  {m.senderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${!m.read ? "font-bold text-retro-text" : "font-medium text-retro-text-dim"}`}>{m.senderName}</p>
                    <span className="text-[10px] text-retro-text-dim ml-2 shrink-0">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${!m.read ? "font-semibold" : "text-retro-text-dim"}`}>{m.subject}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleStar(m.id, m.starred); }}
                  className="text-lg shrink-0 hover:scale-110 transition-transform">{m.starred ? "⭐" : "☆"}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Mail detail */}
        {selected && (
          <div className="flex-1 glass-surface rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelected(null)} className="md:hidden px-3 py-1 rounded-lg bg-retro-dark border border-retro-border text-retro-text-dim text-sm">← Retour</button>
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all">🗑️ Supprimer</button>
            </div>
            <h2 className="text-xl font-bold mb-4">{selected.subject}</h2>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-retro-border">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: genderColor(undefined, selected.senderAvatarColor) }}>
                {selected.senderName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{selected.senderName}</p>
                <p className="text-xs text-retro-text-dim">{selected.senderMassarCode} · {formatDate(selected.createdAt)}</p>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{selected.body}</div>
          </div>
        )}
      </div>
    </div>
  );
}
