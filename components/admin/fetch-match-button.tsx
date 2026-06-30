"use client";

import { useTransition } from "react";
import { fetchAllMatchesForPhase } from "@/actions/matches";

export default function FetchMatchButton({ phaseId }: { phaseId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await fetchAllMatchesForPhase(phaseId);
      if (result?.error) {
        alert(result.error);
      } else if (result?.success) {
        const msg =
          result.imported > 0
            ? `${result.imported} jogo(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} já existia(m)` : ""}.`
            : `Nenhum jogo novo (${result.skipped} já importado(s)).`;
        alert(msg);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
    >
      {isPending ? "Buscando..." : "Buscar jogos"}
    </button>
  );
}
