"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ massarCode: "", name: "", email: "", password: "", confirmPassword: "", gender: "other" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          massarCode: form.massarCode,
          name: form.name,
          email: form.email,
          password: form.password,
          gender: form.gender,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Erreur de réponse du serveur");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Erreur d'inscription");
        setLoading(false);
        return;
      }

      // Registration succeeded — hard redirect
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Register fetch error:", err);
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center chat-gradient retro-grid p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-retro-surface-2 border border-retro-border glow-border mb-4">
            <span className="text-4xl">🆕</span>
          </div>
          <h1 className="text-4xl font-bold neon-text mb-2">MassarChat</h1>
          <p className="text-retro-text-dim text-sm">Rejoignez la communauté 🇲🇦</p>
        </div>

        {/* Register Form */}
        <div className="glass-surface rounded-2xl p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-semibold mb-6 text-center">Inscription</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-slide-up">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">
                📋 Code Massar
              </label>
              <input
                type="text"
                value={form.massarCode}
                onChange={(e) => setForm({ ...form, massarCode: e.target.value })}
                placeholder="M2024XXXX"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">
                👤 Nom complet
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Prénom Nom"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">
                📧 Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.ma"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">👤 Genre</label>
              <div className="flex gap-2">
                {[
                  { value: "male", label: "👨 Masculin", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
                  { value: "female", label: "👩 Féminin", color: "border-pink-500/30 text-pink-400 bg-pink-500/10" },
                  { value: "other", label: "🧑 Autre", color: "border-neon-purple/30 text-neon-purple bg-neon-purple/10" },
                ].map((g) => (
                  <button key={g.value} type="button" onClick={() => setForm({ ...form, gender: g.value })}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${form.gender === g.value ? g.color : "bg-retro-dark border border-retro-border text-retro-text-dim"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-retro-text-dim mb-2">
                  🔒 Mot de passe
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-retro-text-dim mb-2">
                  🔒 Confirmer
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Inscription...
                </span>
              ) : (
                "Créer mon compte ✨"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-retro-text-dim text-sm">
              Déjà inscrit ?{" "}
              <a href="/login" className="text-neon-purple hover:text-neon-cyan transition-colors font-medium">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
