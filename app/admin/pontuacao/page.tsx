import { createClient } from "@/lib/supabase/server";
import ScoreTrigger from "@/components/admin/score-trigger";

export default async function PontuacaoPage() {
  const supabase = await createClient();

  // Finished matches with at least one confirmed (unscored) bet
  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, home_goals_final, away_goals_final, phases(name)")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: true });

  // For each match, check if there are confirmed bets not yet scored
  const unscoredMatches: typeof matches = [];
  if (matches) {
    for (const m of matches) {
      const { count } = await supabase
        .from("bets")
        .select("id", { count: "exact", head: true })
        .eq("match_id", m.id)
        .eq("status", "confirmed");

      if ((count ?? 0) > 0) unscoredMatches.push(m);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Calcular Pontuação
      </h1>

      {unscoredMatches.length === 0 ? (
        <p className="text-[var(--muted)]">
          Nenhuma partida com palpites aguardando pontuação.
        </p>
      ) : (
        <div className="space-y-3 max-w-xl">
          {unscoredMatches.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {m.home_team} {m.home_goals_final} × {m.away_goals_final} {m.away_team}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {(m.phases as unknown as { name: string } | null)?.name}
                </p>
              </div>
              <ScoreTrigger
                matchId={m.id}
                label={`${m.home_team} × ${m.away_team}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
