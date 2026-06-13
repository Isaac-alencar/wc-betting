import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchFinishedWCMatches } from "@/lib/football-api";
import { scoreMatchBets } from "@/lib/scoring-job";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const apiMatches = await fetchFinishedWCMatches();

  let updated = 0;
  let scored = 0;

  for (const apiMatch of apiMatches) {
    const { data: match } = await admin
      .from("matches")
      .select("id, status")
      .eq("external_id", apiMatch.externalId)
      .maybeSingle();

    if (!match) continue;

    if (match.status !== "finished") {
      await admin
        .from("matches")
        .update({
          status: "finished",
          home_goals_final: apiMatch.homeGoals,
          away_goals_final: apiMatch.awayGoals,
        })
        .eq("id", match.id);
      updated++;
    }

    // scoreMatchBets is idempotent — only touches confirmed bets
    const count = await scoreMatchBets(match.id, apiMatch.homeGoals, apiMatch.awayGoals);
    scored += count;
  }

  revalidatePath("/ranking");
  revalidatePath("/");

  return NextResponse.json({ updated, scored });
}
