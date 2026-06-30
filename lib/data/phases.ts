import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types.gen";

export type Phase = Database["public"]["Tables"]["phases"]["Row"];

export async function getOpenPhase(): Promise<Phase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("phases")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function getAllPhases(): Promise<Phase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("phases")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}
