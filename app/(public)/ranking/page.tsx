import { createClient } from "@/lib/supabase/server";
import RankingTable from "@/components/ranking-table";

export const revalidate = 60;

const PRIZE_SPLITS = [0.6, 0.3, 0.1];

async function getRankingData() {
  const supabase = await createClient();

  // Confirmed participants with their scored bets aggregated
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select(
      `
      id,
      display_name,
      payments!inner(phase_id, status),
      bets(status, points, created_at)
      `
    )
    .eq("payments.status", "confirmed");

  type ProfileRow = {
    id: string;
    display_name: string;
    payments: { phase_id: string; status: string }[];
    bets: { status: string; points: number | null; created_at: string }[];
  };
  const typedProfiles = profiles as unknown as ProfileRow[];

  if (!typedProfiles || typedProfiles.length === 0) return { entries: [], totalPot: 0 };

  // Get confirmed payment amounts (phases.pix_amount × confirmed participants per phase)
  const { data: confirmedPayments } = await supabase
    .from("payments")
    .select("phase_id, phases(pix_amount)")
    .eq("status", "confirmed");

  type PaymentWithPhase = { phase_id: string; phases: { pix_amount: number } | null };
  const totalPot =
    (confirmedPayments as unknown as PaymentWithPhase[])?.reduce(
      (sum, p) => sum + Number(p.phases?.pix_amount ?? 0),
      0
    ) ?? 0;

  const entries = typedProfiles
    .map((p) => {
      const scoredBets = p.bets.filter((b) => b.status === "scored");
      const totalPoints = scoredBets.reduce((s, b) => s + (b.points ?? 0), 0);
      const exactScores = scoredBets.filter((b) => b.points === 5).length;

      // First confirmed/scored bet timestamp for tie-breaking
      const confirmedBets = p.bets.filter(
        (b) => b.status === "confirmed" || b.status === "scored"
      );
      const firstBetAt =
        confirmedBets.length > 0
          ? Math.min(...confirmedBets.map((b) => new Date(b.created_at).getTime()))
          : Infinity;

      return {
        id: p.id,
        display_name: p.display_name,
        total_points: totalPoints,
        exact_scores: exactScores,
        first_bet_at: firstBetAt,
      };
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
