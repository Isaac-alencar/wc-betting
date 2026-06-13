import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePoints } from "@/lib/scoring";

export async function scoreMatchBets(
  matchId: string,
  homeGoals: number,
  awayGoals: number
): Promise<number> {
  const admin = createAdminClient();

  const { data: bets } = await admin
    .from("bets")
    .select("id, home_goals_predicted, away_goals_predicted")
    .eq("match_id", matchId)
    .eq("status", "confirmed");

  if (!bets || bets.length === 0) return 0;

  const actual = { home: homeGoals, away: awayGoals };

  for (const bet of bets) {
    const points = calculatePoints(
      { home: bet.home_goals_predicted, away: bet.away_goals_predicted },
      actual
    );
    await admin.from("bets").update({ status: "scored", points }).eq("id", bet.id);
  }

  return bets.length;
}
