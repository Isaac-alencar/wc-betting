"use client";

import { useTransition } from "react";
import { triggerScoring } from "@/actions/scoring";

export default function ScoreTrigger({ matchId, label }: { matchId: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await triggerScoring(matchId);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
    >
      {isPending ? "Calculando..." : `Calcular pontos — ${label}`}
    </button>
  );
}
