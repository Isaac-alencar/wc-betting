import { createClient } from "@/lib/supabase/server";
import ResultForm from "@/components/admin/result-form";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ResultadosPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*, phases(name)")
    .in("status", ["scheduled", "finished"])
    .order("kickoff_at", { ascending: true });

  const now = new Date();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Lançar Resultados
      </h1>

      {!matches || matches.length === 0 ? (
        <p className="text-[var(--muted)]">Nenhuma partida encontrada.</p>
      ) : (
        <div className="space-y-3 max-w-xl">
          {matches.map((m) => {
            const kicked = new Date(m.kickoff_at) <= now;
            return (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {m.home_team} × {m.away_team}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {(m.phases as unknown as { name: string } | null)?.name} ·{" "}
                      {formatKickoff(m.kickoff_at)}
                    </p>
                  </div>

                  {m.status === "finished" ? (
                    <span className="text-xl font-black text-[var(--accent)]">
                      {m.home_goals_final} – {m.away_goals_final}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">
                      {kicked ? "Aguardando resultado" : "Não iniciou"}
                    </span>
                  )}
                </div>

                {m.status === "scheduled" && kicked && (
                  <ResultForm
                    matchId={m.id}
                    homeTeam={m.home_team}
                    awayTeam={m.away_team}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
