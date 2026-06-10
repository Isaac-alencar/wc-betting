"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitBets(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  // Get the open phase
  const { data: phase } = await supabase
    .from("phases")
    .select("id, status")
    .eq("status", "open")
    .maybeSingle();

  if (!phase) return { error: "Nenhuma rodada aberta." };

  // Check user has no confirmed payment for this phase
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("phase_id", phase.id)
    .maybeSingle();

  if (existingPayment?.status === "confirmed") {
    return { error: "Seus palpites já estão confirmados e travados." };
  }

  // Get matches for the phase
  const { data: matches } = await supabase
    .from("matches")
    .select("id")
    .eq("phase_id", phase.id);

  if (!matches || matches.length === 0) {
    return { error: "Nenhuma partida encontrada nesta fase." };
  }

  // Parse and validate all bets from formData
  const betsToUpsert: {
    user_id: string;
    match_id: string;
    home_goals_predicted: number;
    away_goals_predicted: number;
    status: "pending";
  }[] = [];

  for (const match of matches) {
    const homeRaw = formData.get(`home_${match.id}`);
    const awayRaw = formData.get(`away_${match.id}`);

    const home = Number(homeRaw);
    const away = Number(awayRaw);

    if (homeRaw === null || homeRaw === "" || awayRaw === null || awayRaw === "") {
      return { error: "Preencha o placar de todas as partidas." };
    }
    if (!Number.isInteger(home) || home < 0 || !Number.isInteger(away) || away < 0) {
      return { error: "Placar inválido. Use números inteiros ≥ 0." };
    }

    betsToUpsert.push({
      user_id: user.id,
      match_id: match.id,
      home_goals_predicted: home,
      away_goals_predicted: away,
      status: "pending",
    });
  }

  const { error: upsertError } = await supabase
    .from("bets")
    .upsert(betsToUpsert, { onConflict: "user_id,match_id" });

  if (upsertError) return { error: "Erro ao salvar palpites. Tente novamente." };

  // Idempotent — creates payment record if not yet exists
  await supabase
    .from("payments")
    .upsert(
      { user_id: user.id, phase_id: phase.id, status: "pending" },
      { onConflict: "user_id,phase_id", ignoreDuplicates: true }
    );

  redirect(`/pagamento?phase=${phase.id}`);
}
