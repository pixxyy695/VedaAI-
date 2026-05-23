"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, LogIn, Sparkles, UserPlus } from "lucide-react";
import { login, register } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Mode = "login" | "register";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("Teacher Demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { hydrate, isReady, setSession } = useAuthStore();

  useEffect(() => {
    if (!isReady) void hydrate();
  }, [hydrate, isReady]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const session = mode === "register"
        ? await register({ name, email, password })
        : await login({ email, password });
      setSession(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="signal-mark">
          <LockKeyhole size={24} />
        </div>
        <p className="eyebrow">Teacher Workspace</p>
        <h1>Sign in to VedaAI</h1>
        <p className="auth-copy">Every generated paper is stored in your own account and streamed only to your session.</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            <LogIn size={16} />
            Sign in
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
            <UserPlus size={16} />
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Teacher Demo" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teacher@example.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>

          {error && <p className="server-error">{error}</p>}

          <button className="primary-action" disabled={busy} type="submit">
            <Sparkles size={18} />
            {mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
