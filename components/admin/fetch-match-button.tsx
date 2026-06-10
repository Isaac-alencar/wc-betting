"use client";

import { useTransition } from "react";
import { fetchNextBrazilMatch } from "@/actions/matches";

export default function FetchMatchButton({ phaseId }: { phaseId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await fetchNextBrazilMatch(phaseId);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
    >
      {isPending ? "Buscando..." : "Buscar próximo jogo"}
    </button>
  );
}
