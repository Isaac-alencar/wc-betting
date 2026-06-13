"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreMatchBets } from "@/lib/scoring-job";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (
    !user?.email ||
    !process.env.ADMIN_EMAIL ||
    user.email !== process.env.ADMIN_EMAIL
  ) {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function triggerScoring(matchId: string) {
  try {
    await assertAdmin();
  } catch {
    return { error: "Acesso negado." };
  }

  const admin = createAdminClient();

  const { data: match } = await admin
    .from("matches")
    .select("status, home_goals_final, away_goals_final")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partida não encontrada." };
  if (match.status !== "finished") {
    return { error: "A partida ainda não foi finalizada." };
  }
  if (match.home_goals_final == null || match.away_goals_final == null) {
    return { error: "Resultado da partida não registrado." };
  }

  const scored = await scoreMatchBets(
    matchId,
    match.home_goals_final,
    match.away_goals_final
  );

  revalidatePath("/admin/pontuacao");
  revalidatePath("/ranking");
  return { success: true, scored };
}
