"use client";

import { useState, useTransition } from "react";
import { saveDisplayName } from "@/actions/auth";
import { useRouter } from "next/navigation";

export function DisplayNameModal() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveDisplayName(name);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
          Seu nome no ranking
        </h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          Como você quer aparecer para os outros participantes?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João Silva"
            maxLength={40}
            autoFocus
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />

          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || name.trim().length < 2}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-bold text-black transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Salvando..." : "Confirmar"}
          </button>
        </form>
      </div>
    </div>
  );
}
