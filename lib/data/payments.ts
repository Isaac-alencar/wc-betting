import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types.gen";

export type Payment = Database["public"]["Tables"]["payments"]["Row"];

export async function getUserPayment(
  userId: string,
  phaseId: string
): Promise<Payment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .maybeSingle();
  return data;
}

export async function getPendingPayments(): Promise<
  (Payment & { user_profiles: { display_name: string } | null; phases: { name: string } })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, user_profiles(display_name), phases(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as (Payment & {
    user_profiles: { display_name: string } | null;
    phases: { name: string };
  })[];
}
