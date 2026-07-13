"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetch";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string;
  massarCode: string;
  avatarColor: string;
  status: string;
}

export default function PrivateConversationPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/messages/private/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setPartner(data.partner);
      }
    } catch {
      // Silent fail
    }
  }, [partnerId]);

  useEffect(() => {
    fetchData().finally(() => {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: "me",
      receiverId: partnerId,
      content,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiFetch("/api/messages/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content }),
      });
      if (res.ok) {
        fetchData();
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setNewMessage(content);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="text-4xl mb-3 animate-glow-pulse">✉️</div>
          <p className="text-retro-text-dim">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-retro-border bg-retro-surface/50 flex items-center gap-3 shrink-0">
        <button onClick={() => router.push("/dashboard/chat/private")} className="p-1.5 rounded-lg hover:bg-retro-surface-2 text-retro-text-dim lg:hidden">
          ←
        </button>
        {partner && (
          <>
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: partner.avatarColor || "#8B5CF6" }}
              >
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-retro-surface status-${partner.status}`} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{partner.name}</h2>
              <p className="text-xs text-retro-text-dim">
                {partner.status === "online" ? "🟢 En ligne" : partner.status === "away" ? "🟡 Absent" : "⚫ Hors ligne"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">👋</div>
              <h3 className="font-semibold mb-1">
                Dites bonjour à {partner?.name || "votre ami"} !
              </h3>
              <p className="text-retro-text-dim text-sm">Envoyez votre premier message ✨</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === "me";
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 animate-message-pop`}>
                <div className={`max-w-[75%] ${isOwn ? "order-1" : ""}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-gradient-to-r from-neon-purple to-neon-pink/80 text-white rounded-br-sm"
                        : "bg-retro-surface-2 text-retro-text rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                    <span className="text-[10px] text-retro-text-dim">{formatTime(msg.createdAt)}</span>
                    {isOwn && (
                      <span className="text-[10px] text-neon-green">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-retro-border bg-retro-surface/50 shrink-0">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Écrire à ${partner?.name || "..."}...`}
            className="flex-1 px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 disabled:opacity-30 transition-all"
          >
            Envoyer ↵
          </button>
        </form>
      </div>
    </div>
  );
}
