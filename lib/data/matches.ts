import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types.gen";

export type Match = Database["public"]["Tables"]["matches"]["Row"];

export async function getMatchesForPhase(phaseId: string): Promise<Match[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("phase_id", phaseId)
    .order("kickoff_at", { ascending: true });
  return data ?? [];
}

export async function getScheduledMatchesForPhase(phaseId: string): Promise<Match[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("phase_id", phaseId)
    .eq("status", "scheduled")
    .order("kickoff_at", { ascending: true });
  return data ?? [];
}
