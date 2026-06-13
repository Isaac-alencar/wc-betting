import { createAdminClient } from "@/lib/supabase/admin";
import RankingTable from "@/components/ranking-table";

export const revalidate = 60;

const PRIZE_SPLITS = [0.6, 0.3, 0.1];

async function getRankingData() {
  const supabase = createAdminClient();

  // 1. Confirmed payments + phase amounts in one query
  const { data: confirmedPayments } = await supabase
    .from("payments")
    .select("user_id, phase_id")
    .eq("status", "confirmed");

  if (!confirmedPayments || confirmedPayments.length === 0) return { entries: [], totalPot: 0 };

  const confirmedUserIds = [...new Set(confirmedPayments.map((p) => p.user_id))];
  const confirmedPhaseIds = [...new Set(confirmedPayments.map((p) => p.phase_id))];

  // 2. Phase amounts for prize pot
  const { data: phases } = await supabase
    .from("phases")
    .select("id, pix_amount")
    .in("id", confirmedPhaseIds);

  const phaseAmount = Object.fromEntries(
    (phases ?? []).map((ph) => [ph.id, Number(ph.pix_amount)])
  );
  const totalPot = confirmedPayments.reduce(
    (sum, p) => sum + (phaseAmount[p.phase_id] ?? 0),
    0
  );

  // 3. Display names
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name")
    .in("id", confirmedUserIds);

  if (!profiles || profiles.length === 0) return { entries: [], totalPot: 0 };

  // 4. All bets for confirmed users
  const { data: bets } = await supabase
    .from("bets")
    .select("user_id, status, points, created_at")
    .in("user_id", confirmedUserIds);

  const betsByUser: Record<string, typeof bets> = {};
  for (const bet of bets ?? []) {
    (betsByUser[bet.user_id] ??= []).push(bet);
  }

  const entries = profiles
    .map((profile) => {
      const userBets = betsByUser[profile.id] ?? [];
      const scoredBets = userBets.filter((b) => b.status === "scored");
      const totalPoints = scoredBets.reduce((s, b) => s + (b.points ?? 0), 0);
      const exactScores = scoredBets.filter((b) => b.points === 5).length;

      const activeBets = userBets.filter(
        (b) => b.status === "confirmed" || b.status === "scored"
      );
      const firstBetAt =
        activeBets.length > 0
          ? Math.min(...activeBets.map((b) => new Date(b.created_at).getTime()))
          : Infinity;

      return { id: profile.id, display_name: profile.display_name, total_points: totalPoints, exact_scores: exactScores, first_bet_at: firstBetAt };
    })
    .sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores;
      return a.first_bet_at - b.first_bet_at;
    });

  const ranked = entries.map((entry, i) => ({
    display_name: entry.display_name,
    total_points: entry.total_points,
    exact_scores: entry.exact_scores,
    prize: i < 3 ? totalPot * PRIZE_SPLITS[i] : null,
  }));

  return { entries: ranked, totalPot };
}

export default async function RankingPage() {
  const { entries, totalPot } = await getRankingData();

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--accent)]">Ranking</h1>
          <p className="text-sm text-[var(--muted)]">Copa do Mundo 2026 · Brasil</p>
        </div>

        {totalPot > 0 && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <p className="text-sm text-[var(--muted)]">Prêmio estimado total</p>
            <p className="text-2xl font-black text-[var(--accent)]">
              R$ {totalPot.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              60% / 30% / 10% para os 3 primeiros
            </p>
          </div>
        )}

        <RankingTable entries={entries} />

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Atualizado a cada 60 segundos
        </p>
      </div>
    </main>
  );
}
