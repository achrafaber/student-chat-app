"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetch";
import { genderColor } from "@/app/dashboard/layout";

interface Message { id: string; content: string; type: string; textColor: string; textFormat: string; textSize: string; createdAt: string; userId: string; userName: string; userAvatarColor: string; userGender: string; userMassarCode: string; }
interface Member { id: string; name: string; massarCode: string; avatarColor: string; gender: string; status: string; role: string; }
interface RoomInfo { id: string; name: string; description: string; icon: string; category: string; isPrivate: boolean; joinCode: string | null; maxMembers: number; isMember: boolean; createdBy: string; }

const EMOJI_LIST = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","⭐","🎉","🎵","💀","🤣","😭","🥺","😏","🙌","💪","🤝","✌️","🤞","👋","🫡","🤗","😴","🤮","🫠","😈","👻","🎃","🌟","💫","🍕","🍔","☕","🍺","🎮","⚽","🏀","📚","✈️","🏠","💻","📱","🔔","💬","✅","❌","⏰","🎯","🏆","🎨","🎭","🎪","🌈","☀️","🌙","❄️","🌊","🌸","🌺","🦋","🐱","🐶","🦁","🐉","🇲🇦"];

const TEXT_COLORS = [
  { value: "default", label: "Default", color: "#E2D9F3" },
  { value: "#EF4444", label: "Rouge", color: "#EF4444" },
  { value: "#F59E0B", label: "Jaune", color: "#F59E0B" },
  { value: "#10B981", label: "Vert", color: "#10B981" },
  { value: "#3B82F6", label: "Bleu", color: "#3B82F6" },
  { value: "#8B5CF6", label: "Violet", color: "#8B5CF6" },
  { value: "#EC4899", label: "Rose", color: "#EC4899" },
  { value: "#06B6D4", label: "Cyan", color: "#06B6D4" },
  { value: "#F97316", label: "Orange", color: "#F97316" },
];

const TEXT_SIZES = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [kickError, setKickError] = useState("");
  const [textColor, setTextColor] = useState("default");
  const [textFormat, setTextFormat] = useState("normal");
  const [textSize, setTextSize] = useState("md");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const fetchRoom = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomId}`);
      if (!res.ok) { router.push("/dashboard/chat/rooms"); return; }
      const data = await res.json();
      setRoom(data.room);
      setMembers(data.members || []);
    } catch { router.push("/dashboard/chat/rooms"); }
  }, [roomId, router]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomId}/messages`);
      if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
    } catch { /* */ }
  }, [roomId]);

  useEffect(() => {
    const load = async () => { await fetchRoom(); await fetchMessages(); setLoading(false); setTimeout(scrollToBottom, 100); };
    load();
  }, [fetchRoom, fetchMessages]);

  useEffect(() => { const i = setInterval(fetchMessages, 3000); return () => clearInterval(i); }, [fetchMessages]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleJoin = async () => {
    const body: Record<string, string> = {};
    if (room?.isPrivate && room?.joinCode) { body.joinCode = joinCodeInput; }
    const res = await apiFetch(`/api/rooms/${roomId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { fetchRoom(); fetchMessages(); setShowJoinCode(false); }
    else { const d = await res.json(); setKickError(d.error || "Erreur"); setTimeout(() => setKickError(""), 3000); }
  };

  const handleLeave = async () => {
    await apiFetch(`/api/rooms/${roomId}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    fetchRoom();
  };

  const handleKick = async (userId: string) => {
    setKickError("");
    const res = await apiFetch(`/api/rooms/${roomId}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kickUserId: userId }) });
    if (res.ok) { fetchRoom(); }
    else { const d = await res.json(); setKickError(d.error || "Erreur"); setTimeout(() => setKickError(""), 3000); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`, content, type: content.startsWith("/me ") ? "action" : "text",
      textColor, textFormat, textSize, createdAt: new Date().toISOString(),
      userId: "me", userName: "Vous", userAvatarColor: "#8B5CF6", userGender: "other", userMassarCode: "",
    };
    if (optimisticMsg.type === "action") optimisticMsg.content = content.substring(4);
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiFetch(`/api/rooms/${roomId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, textColor, textFormat, textSize }),
      });
      if (res.ok) fetchMessages();
      else { setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id)); setNewMessage(content); }
    } catch { setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id)); setNewMessage(content); }
    finally { setSending(false); }
  };

  const addEmoji = (emoji: string) => { setNewMessage((p) => p + emoji); setShowEmojis(false); };

  const toggleFormat = (fmt: string) => {
    if (textFormat === fmt) setTextFormat("normal");
    else setTextFormat(fmt);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: string) => {
    const date = new Date(d); const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (date.toDateString() === y.toDateString()) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  const myMember = members.find((m) => m.id === "me");
  const isOwner = members.some((m) => m.role === "owner" && m.id === "me");

  const getMsgStyle = (msg: Message): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (msg.textColor && msg.textColor !== "default") style.color = msg.textColor;
    if (msg.textFormat === "bold") style.fontWeight = "bold";
    if (msg.textFormat === "italic") style.fontStyle = "italic";
    if (msg.textFormat === "bold-italic") { style.fontWeight = "bold"; style.fontStyle = "italic"; }
    if (msg.textFormat === "underline") { style.textDecoration = "underline"; }
    if (msg.textSize === "sm") style.fontSize = "0.75rem";
    if (msg.textSize === "lg") style.fontSize = "1.125rem";
    if (msg.textSize === "xl") style.fontSize = "1.375rem";
    return style;
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-center animate-fade-in"><div className="text-4xl mb-3 animate-glow-pulse">💬</div><p className="text-retro-text-dim">Chargement du salon...</p></div></div>;
  if (!room) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Room header */}
        <div className="px-4 py-3 border-b border-retro-border bg-retro-surface/50 flex items-center gap-3 shrink-0">
          <button onClick={() => router.push("/dashboard/chat/rooms")} className="p-1.5 rounded-lg hover:bg-retro-surface-2 text-retro-text-dim lg:hidden">←</button>
          <div className="w-10 h-10 rounded-xl bg-retro-surface-2 flex items-center justify-center text-xl shrink-0">{room.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm truncate">{room.name}</h2>
              {room.isPrivate && <span className="px-1.5 py-0.5 rounded text-[10px] bg-neon-yellow/10 text-neon-yellow font-bold">🔒 PRIVÉ</span>}
            </div>
            <p className="text-xs text-retro-text-dim">{members.length} membres</p>
          </div>
          {kickError && <span className="text-xs text-red-400">⚠️ {kickError}</span>}
          <div className="flex items-center gap-2">
            {!room.isMember ? (
              room.isPrivate ? (
                <button onClick={() => setShowJoinCode(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-medium hover:opacity-90 transition-all">Rejoindre 🔒</button>
              ) : (
                <button onClick={handleJoin} className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white text-xs font-medium hover:opacity-90 transition-all">Rejoindre ✨</button>
              )
            ) : (
              <button onClick={handleLeave} className="px-3 py-2 rounded-lg bg-retro-dark border border-retro-border text-retro-text-dim text-xs hover:text-red-400 hover:border-red-400/30 transition-all">Quitter</button>
            )}
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-lg transition-all ${showMembers ? "bg-neon-purple/20 text-neon-purple" : "hover:bg-retro-surface-2 text-retro-text-dim"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Join code modal */}
        {showJoinCode && (
          <div className="px-4 py-3 bg-neon-yellow/5 border-b border-neon-yellow/20 animate-slide-up">
            <p className="text-sm text-neon-yellow mb-2">🔒 Ce salon est privé. Entrez le code d&apos;accès :</p>
            <div className="flex gap-2">
              <input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="Code d'accès" className="flex-1 px-3 py-2 rounded-lg bg-retro-dark border border-retro-border text-retro-text text-sm focus:outline-none focus:border-neon-purple" />
              <button onClick={handleJoin} className="px-4 py-2 rounded-lg bg-neon-purple text-white text-sm font-medium hover:opacity-90">Entrer</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {!room.isMember ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center glass-surface rounded-2xl p-8 max-w-md">
                <div className="text-5xl mb-4">{room.isPrivate ? "🔒" : "💬"}</div>
                <h3 className="text-lg font-semibold mb-2">{room.isPrivate ? "Salon privé" : "Rejoignez ce salon"}</h3>
                <p className="text-retro-text-dim text-sm mb-4">{room.description}</p>
                {room.isPrivate ? (
                  <div className="space-y-2">
                    <input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="Code d'accès" className="w-full px-4 py-2 rounded-xl bg-retro-dark border border-retro-border text-retro-text text-sm focus:outline-none focus:border-neon-purple" />
                    <button onClick={handleJoin} className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90">Rejoindre 🔒</button>
                  </div>
                ) : (
                  <button onClick={handleJoin} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90">Rejoindre ✨</button>
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full"><div className="text-center"><div className="text-4xl mb-3">💬</div><h3 className="font-semibold mb-1">Bienvenue dans {room.name} !</h3><p className="text-retro-text-dim text-sm">Tapez /me pour une action MSN ✨</p></div></div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
                const isOwn = msg.userId === "me";
                const nameColor = genderColor(msg.userGender, msg.userAvatarColor);

                return (
                  <div key={msg.id}>
                    {showDate && <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-retro-border" /><span className="text-xs text-retro-text-dim">{formatDate(msg.createdAt)}</span><div className="flex-1 h-px bg-retro-border" /></div>}

                    {/* Action message (MSN /me style) */}
                    {msg.type === "action" ? (
                      <div className="py-1.5 px-3 text-sm italic text-neon-cyan/80 animate-message-pop">
                        * <span style={{ color: nameColor }} className="font-semibold">{msg.userName}</span> {msg.content}
                      </div>
                    ) : (
                      <div className={`flex gap-3 py-1.5 px-2 rounded-lg hover:bg-retro-surface/50 transition-all group animate-message-pop ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: nameColor }}>
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                          <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "justify-end" : ""}`}>
                            <span className="text-xs font-semibold" style={{ color: nameColor }}>{msg.userName}</span>
                            <span className="text-[10px] text-retro-text-dim opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.createdAt)}</span>
                          </div>
                          <div className={`inline-block px-3 py-2 rounded-xl text-sm ${isOwn ? "bg-neon-purple/20 text-retro-text rounded-br-sm" : "bg-retro-surface-2 text-retro-text rounded-bl-sm"}`} style={getMsgStyle(msg)}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input toolbar */}
        {room.isMember && (
          <div className="border-t border-retro-border bg-retro-surface/50 shrink-0">
            {/* Formatting bar */}
            <div className="flex items-center gap-1 px-4 pt-2 pb-1">
              {/* Emoji picker toggle */}
              <button onClick={() => { setShowEmojis(!showEmojis); setShowColors(false); }} className={`px-2 py-1 rounded text-sm ${showEmojis ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>😀</button>
              {/* Color picker */}
              <button onClick={() => { setShowColors(!showColors); setShowEmojis(false); }} className={`px-2 py-1 rounded text-sm ${showColors ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>🎨</button>
              {/* Bold */}
              <button onClick={() => toggleFormat(textFormat === "bold" ? "normal" : "bold")} className={`px-2 py-1 rounded text-sm font-bold ${textFormat === "bold" || textFormat === "bold-italic" ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>B</button>
              {/* Italic */}
              <button onClick={() => toggleFormat(textFormat === "italic" ? "normal" : "italic")} className={`px-2 py-1 rounded text-sm italic ${textFormat === "italic" || textFormat === "bold-italic" ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>I</button>
              {/* Underline */}
              <button onClick={() => toggleFormat(textFormat === "underline" ? "normal" : "underline")} className={`px-2 py-1 rounded text-sm underline ${textFormat === "underline" ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>U</button>
              <div className="w-px h-5 bg-retro-border mx-1" />
              {/* Size buttons */}
              {TEXT_SIZES.map((s) => (
                <button key={s.value} onClick={() => setTextSize(s.value)} className={`px-2 py-1 rounded text-xs font-medium ${textSize === s.value ? "bg-neon-purple/20 text-neon-purple" : "text-retro-text-dim hover:text-retro-text"}`}>{s.label}</button>
              ))}
              <div className="flex-1" />
              <span className="text-[10px] text-retro-text-dim">/me = action MSN</span>
            </div>

            {/* Emoji panel */}
            {showEmojis && (
              <div className="px-4 pb-2 animate-slide-up">
                <div className="glass-surface rounded-xl p-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {EMOJI_LIST.map((e) => <button key={e} onClick={() => addEmoji(e)} className="w-8 h-8 rounded-lg hover:bg-retro-surface-2 flex items-center justify-center text-lg transition-all hover:scale-110">{e}</button>)}
                </div>
              </div>
            )}

            {/* Color panel */}
            {showColors && (
              <div className="px-4 pb-2 animate-slide-up">
                <div className="glass-surface rounded-xl p-3 flex flex-wrap gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => { setTextColor(c.value); setShowColors(false); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === c.value ? "border-white scale-110" : "border-transparent hover:scale-110"}`}
                      style={{ backgroundColor: c.color }} title={c.label} />
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <form onSubmit={handleSend} className="flex gap-3 p-4 pt-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message... (/me pour une action)" className="flex-1 px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all" disabled={sending} />
              <button type="submit" disabled={!newMessage.trim() || sending}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 disabled:opacity-30 transition-all">Envoyer ↵</button>
            </form>
          </div>
        )}
      </div>

      {/* Members sidebar */}
      {showMembers && (
        <div className="w-64 border-l border-retro-border bg-retro-surface/50 shrink-0 hidden lg:block animate-slide-in-left">
          <div className="p-4 border-b border-retro-border">
            <h3 className="font-semibold text-sm">Membres ({members.length})</h3>
            {room.isPrivate && room.joinCode && isOwner && (
              <div className="mt-2 p-2 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20">
                <p className="text-[10px] text-neon-yellow">Code d&apos;accès :</p>
                <p className="font-mono text-sm text-neon-yellow font-bold">{room.joinCode}</p>
              </div>
            )}
          </div>
          <div className="overflow-y-auto p-3 space-y-1">
            {members.map((member) => {
              const mc = genderColor(member.gender, member.avatarColor);
              const canKick = isOwner && member.role !== "owner";
              return (
                <div key={member.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-retro-surface-2 transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: mc }}>{member.name.charAt(0).toUpperCase()}</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-retro-surface status-${member.status}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: mc }}>{member.name}</p>
                    <p className="text-[10px] text-retro-text-dim">{member.role === "owner" ? "👑 Propriétaire" : member.role === "admin" ? "🛡️ Admin" : "👤 Membre"}</p>
                  </div>
                  {canKick && (
                    <button onClick={() => handleKick(member.id)} title="Exclure"
                      className="opacity-0 group-hover:opacity-100 px-1.5 py-1 rounded text-red-400 text-xs hover:bg-red-500/10 transition-all">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
