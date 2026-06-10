import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types.gen";

export type Bet = Database["public"]["Tables"]["bets"]["Row"];

export async function getUserBetsForMatches(
  userId: string,
  matchIds: string[]
): Promise<Bet[]> {
  if (matchIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", userId)
    .in("match_id", matchIds);
  return data ?? [];
}

export async function getConfirmedBetsForMatch(matchId: string): Promise<Bet[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("status", "confirmed");
  return data ?? [];
}
