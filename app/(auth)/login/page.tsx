"use client";

import { useState, useTransition } from "react";
import { signInWithEmail, signUpWithEmail, signInAnonymously } from "@/actions/auth";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = mode === "login" ? signInWithEmail : signUpWithEmail;
      const result = await action(formData);
      if (result?.error) setError(result.error);
      if (result && "emailSent" in result && result.emailSent) setEmailSent(true);
    });
  }

  function handleAnonymous() {
    setError(null);
    startTransition(async () => {
      const result = await signInAnonymously();
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <span className="text-4xl font-black tracking-tight text-[var(--accent)]">
            BOLÃO
          </span>
          <p className="text-[var(--muted)] text-sm mt-1">Copa do Mundo 2026 · Brasil</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
          {emailSent ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-2xl">📬</p>
              <p className="font-semibold text-[var(--foreground)]">Confirme seu e-mail</p>
              <p className="text-sm text-[var(--muted)]">
                Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta e entrar.
              </p>
              <button
                onClick={() => { setEmailSent(false); setMode("login"); }}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Já confirmei — ir para login
              </button>
            </div>
          ) : (
          <>
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-[var(--background)] p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-[var(--surface-raised)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />

            {error && (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-bold text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {isPending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">ou</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Anonymous entry */}
          <button
            onClick={handleAnonymous}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40"
          >
            Entrar sem cadastro
          </button>

          <p className="mt-3 text-center text-xs text-[var(--muted)]">
            Entrar sem cadastro vincula a conta ao seu navegador.
          </p>
          </>
          )}
        </div>
      </div>
    </main>
  );
}
