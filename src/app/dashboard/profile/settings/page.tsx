"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const avatarColors = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
  "#3B82F6", "#EF4444", "#6366F1", "#14B8A6",
  "#F97316", "#84CC16", "#06B6D4", "#D946EF",
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", bio: "", avatarColor: "#8B5CF6", status: "online" });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setForm({
          name: data.user.name,
          bio: data.user.bio || "",
          avatarColor: data.user.avatarColor || "#8B5CF6",
          status: data.user.status || "online",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-10 bg-retro-surface-2 rounded-xl animate-pulse w-48" />
        <div className="h-80 bg-retro-surface-2 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">⚙️ Paramètres</h1>
          <p className="text-retro-text-dim text-sm mt-1">Modifiez votre profil</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="px-4 py-2 rounded-xl bg-retro-surface border border-retro-border text-retro-text-dim text-sm hover:text-retro-text transition-all"
        >
          ← Retour
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm animate-slide-up">
          ✅ Profil mis à jour avec succès !
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-slide-up">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="glass-surface rounded-2xl p-6 space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {/* Avatar color */}
        <div>
          <label className="block text-sm font-semibold text-retro-text-dim mb-3">🎨 Couleur de l&apos;avatar</label>
          <div className="flex flex-wrap gap-3">
            {avatarColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, avatarColor: color })}
                className={`w-12 h-12 rounded-xl transition-all ${
                  form.avatarColor === color
                    ? "ring-2 ring-white ring-offset-2 ring-offset-retro-surface scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: form.avatarColor }}
            >
              {form.name ? form.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="text-xs text-retro-text-dim">Aperçu de votre avatar</div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-retro-text-dim mb-2">👤 Nom complet</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-retro-text-dim mb-2">📝 Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Parlez-nous de vous..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple transition-all resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-retro-text-dim mb-2">📊 Statut</label>
          <div className="flex gap-3">
            {[
              { value: "online", label: "En ligne", icon: "🟢" },
              { value: "away", label: "Absent", icon: "🟡" },
              { value: "offline", label: "Hors ligne", icon: "⚫" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm({ ...form, status: s.value })}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  form.status === s.value
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                    : "bg-retro-dark border border-retro-border text-retro-text-dim hover:text-retro-text"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder ✨"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/profile")}
            className="px-6 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text-dim text-sm hover:text-retro-text transition-all"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
