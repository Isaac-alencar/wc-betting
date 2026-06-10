import { getAllPhases } from "@/lib/data/phases";
import { createPhase, updatePhaseStatus } from "@/actions/phases";
import { fetchNextBrazilMatch } from "@/actions/matches";
import FetchMatchButton from "@/components/admin/fetch-match-button";

const STATUS_LABEL: Record<string, string> = {
  closed: "Fechada",
  open: "Aberta",
  betting_locked: "Apostas encerradas",
  finished: "Finalizada",
};

const NEXT_ACTION: Record<string, { label: string; next: string } | null> = {
  closed: { label: "Abrir", next: "open" },
  open: { label: "Fechar apostas", next: "betting_locked" },
  betting_locked: { label: "Finalizar", next: "finished" },
  finished: null,
};

export default async function FasesPage() {
  const phases = await getAllPhases();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Gerenciar Fases
      </h1>

      {/* Phase list */}
      <div className="space-y-3 mb-8 max-w-xl">
        {phases.length === 0 && (
          <p className="text-[var(--muted)]">Nenhuma fase criada ainda.</p>
        )}
        {phases.map((phase) => {
          const nextAction = NEXT_ACTION[phase.status];
          return (
            <div
              key={phase.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-[var(--foreground)]">{phase.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  R$ {Number(phase.pix_amount).toFixed(2).replace(".", ",")} ·{" "}
                  <span
                    className={
                      phase.status === "open"
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted)]"
                    }
                  >
                    {STATUS_LABEL[phase.status]}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 items-center">
                {nextAction && (
                  <form
                    action={async () => {
                      "use server";
                      await updatePhaseStatus(phase.id, nextAction.next);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
                    >
                      {nextAction.label}
                    </button>
                  </form>
                )}
                <FetchMatchButton phaseId={phase.id} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Create new phase */}
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          Nova Fase
        </h2>
        <form
          action={async (fd) => {
            "use server";
            await createPhase(fd);
          }}
          className="space-y-3"
        >
          <input
            name="name"
            type="text"
            placeholder="Ex: Oitavas de Final"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          <input
            name="pix_amount"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Valor PIX (ex: 25.00)"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
          >
            Criar Fase
          </button>
        </form>
      </div>
    </div>
  );
}

