"use client";

import { useState, useTransition } from "react";
import { enterResult } from "@/actions/matches";

interface ResultFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
}

export default function ResultForm({ matchId, homeTeam, awayTeam }: ResultFormProps) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const h = parseInt(home, 10);
    const a = parseInt(away, 10);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Insira valores válidos (≥ 0).");
      return;
    }

    startTransition(async () => {
      const result = await enterResult(matchId, h, a);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="number"
        min={0}
        step={1}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        placeholder={homeTeam}
        required
        className="w-14 rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-center text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
      />
      <span className="text-[var(--muted)]">×</span>
      <input
        type="number"
        min={0}
        step={1}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        placeholder={awayTeam}
        required
        className="w-14 rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-center text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
      >
        {isPending ? "..." : "Salvar"}
      </button>
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </form>
  );
}
