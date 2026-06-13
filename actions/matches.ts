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

export async function enterResult(
  matchId: string,
  homeGoals: number,
  awayGoals: number
) {
  try {
    await assertAdmin();
  } catch {
    return { error: "Acesso negado." };
  }

  if (!Number.isInteger(homeGoals) || homeGoals < 0) {
    return { error: "Gols do mandante inválido." };
  }
  if (!Number.isInteger(awayGoals) || awayGoals < 0) {
    return { error: "Gols do visitante inválido." };
  }

  const admin = createAdminClient();

  const { data: match } = await admin
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Partida não encontrada." };
  if (match.status === "finished") {
    return { error: "Resultado já registrado para esta partida." };
  }

  const { error } = await admin
    .from("matches")
    .update({
      home_goals_final: homeGoals,
      away_goals_final: awayGoals,
      status: "finished",
    })
    .eq("id", matchId);

  if (error) return { error: `Erro ao salvar resultado: ${error.message}` };

  await scoreMatchBets(matchId, homeGoals, awayGoals);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin/pontuacao");
  revalidatePath("/ranking");
  revalidatePath("/");
  return { success: true };
}

export async function fetchNextBrazilMatch(phaseId: string) {
  try {
    await assertAdmin();
  } catch {
    return { error: "Acesso negado." };
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return { error: "FOOTBALL_DATA_API_KEY não configurada." };

  const { fetchBrazilNextMatch } = await import("@/lib/football-api");
  const result = await fetchBrazilNextMatch();

  if (!result) return { error: "Nenhum próximo jogo encontrado para o Brasil." };

  const admin = createAdminClient();

  // Idempotent — skip if external_id already exists
  const { data: existing } = await admin
    .from("matches")
    .select("id")
    .eq("external_id", result.externalId)
    .maybeSingle();

  if (existing) return { error: "Partida já importada." };

  const { error } = await admin.from("matches").insert({
    phase_id: phaseId,
    home_team: result.homeTeam,
    away_team: result.awayTeam,
    kickoff_at: result.kickoffAt,
    external_id: result.externalId,
    status: "scheduled",
  });

  if (error) return { error: `Erro ao inserir partida: ${error.message}` };

  revalidatePath("/admin/fases");
  revalidatePath("/");
  return { success: true };
}
