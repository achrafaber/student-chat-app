"use client";

import { useState, useRef } from "react";

export default function LoginPage() {
  const [massarCode, setMassarCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!massarCode.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ massarCode: massarCode.trim(), password }),
      });

      // Try to parse JSON
      let data: { user?: { id: string }; error?: string } = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        setError("Erreur serveur — réponse invalide");
        setLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Erreur de connexion");
        setLoading(false);
        return;
      }

      // Success! Redirect to dashboard with a full page reload
      // Use replace to avoid back-button issues
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Impossible de contacter le serveur. Réessayez.");
      setLoading(false);
    }
  };

  const fillDemo = (code: string, pass: string) => {
    setMassarCode(code);
    setPassword(pass);
    // Small delay so React state updates, then auto-submit
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 150);
  };

  return (
    <div className="min-h-screen flex items-center justify-center chat-gradient retro-grid p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-retro-surface-2 border border-retro-border glow-border mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <h1 className="text-4xl font-bold neon-text mb-2">MassarChat</h1>
          <p className="text-retro-text-dim text-sm">Le chat des étudiants 🇲🇦</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" />
            <span className="text-xs text-neon-green">En ligne</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass-surface rounded-2xl p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-semibold mb-6 text-center">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-slide-up">
              ⚠️ {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">
                📋 Code Massar
              </label>
              <input
                type="text"
                value={massarCode}
                onChange={(e) => setMassarCode(e.target.value)}
                placeholder="M2024XXXX"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-retro-text-dim mb-2">
                🔒 Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-retro-dark border border-retro-border text-retro-text placeholder-retro-text-dim/50 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all"
                required
                autoComplete="current-password"
              />
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
                  Connexion...
                </span>
              ) : (
                "Se connecter 🔐"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-retro-text-dim text-sm">
              Pas encore de compte ?{" "}
              <a href="/register" className="text-neon-purple hover:text-neon-cyan transition-colors font-medium">
                S&apos;inscrire
              </a>
            </p>
          </div>
        </div>

        {/* Demo credentials — one-click login */}
        <div className="mt-6 glass-surface rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-retro-text-dim mb-3">⚡ Connexion rapide démo :</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("M20240001", "password123")}
              disabled={loading}
              className="px-3 py-2.5 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20 transition-all font-medium text-sm disabled:opacity-50"
            >
              👤 Youssef
            </button>
            <button
              type="button"
              onClick={() => fillDemo("M20240002", "password123")}
              disabled={loading}
              className="px-3 py-2.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20 transition-all font-medium text-sm disabled:opacity-50"
            >
              👤 Fatima
            </button>
          </div>
          <p className="text-[10px] text-retro-text-dim/50 mt-2">M2024000X / password123</p>
        </div>

        {/* Retro decoration */}
        <div className="text-center mt-8 text-retro-text-dim/30 text-xs">
          <p>☽ MassarChat v1.0 ☽</p>
          <p>Le chat des années 2024 ✨</p>
        </div>
      </div>
    </div>
  );
}
