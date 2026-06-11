import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!;
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!;
const PHASE_ID = "00000000-0000-0000-0000-000000000010";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET);

interface ApiMatch {
  id: number;
  status: string;
  stage: string;
  utcDate: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

async function main() {
  const res = await fetch(
    "https://api.football-data.org/v4/teams/764/matches?competitions=WC&season=2026",
    { headers: { "X-Auth-Token": API_KEY } }
  );

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const json = (await res.json()) as { matches: ApiMatch[] };

  const groupMatches = json.matches.filter((m) => m.stage === "GROUP_STAGE");

  if (groupMatches.length === 0) {
    console.log("No group stage matches found. Dumping first 3 matches:");
    json.matches.slice(0, 3).forEach((m) =>
      console.log(
        `  stage=${m.stage} ${m.homeTeam.name} vs ${m.awayTeam.name} @ ${m.utcDate}`
      )
    );
    process.exit(0);
  }

  console.log(`Found ${groupMatches.length} group stage matches for Brazil:`);

  // Fetch existing seeded match IDs in order
  const { data: existing, error: fetchErr } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .eq("phase_id", PHASE_ID)
    .order("kickoff_at", { ascending: true });

  if (fetchErr) {
    console.error("Failed to fetch existing matches:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Existing seeded matches: ${existing?.length ?? 0}`);

  for (let i = 0; i < groupMatches.length; i++) {
    const m = groupMatches[i];
    const seeded = existing?.[i];

    const homeTeam = m.homeTeam.name;
    const awayTeam = m.awayTeam.name;
    const kickoffAt = m.utcDate;
    const externalId = String(m.id);
    const status =
      m.status === "FINISHED"
        ? "finished"
        : m.status === "IN_PLAY" || m.status === "PAUSED"
        ? "live"
        : "scheduled";

    const homeGoals =
      m.score.fullTime.home != null ? m.score.fullTime.home : null;
    const awayGoals =
      m.score.fullTime.away != null ? m.score.fullTime.away : null;

    if (seeded) {
      // Update the seeded placeholder row
      const { error } = await supabase
        .from("matches")
        .update({
          home_team: homeTeam,
          away_team: awayTeam,
          kickoff_at: kickoffAt,
          external_id: externalId,
          status,
          ...(homeGoals != null && { home_goals_final: homeGoals }),
          ...(awayGoals != null && { away_goals_final: awayGoals }),
        })
        .eq("id", seeded.id);

      if (error) {
        console.error(`Failed to update ${seeded.id}:`, error.message);
      } else {
        console.log(
          `✓ Updated [${seeded.id}] → ${homeTeam} vs ${awayTeam} @ ${kickoffAt}`
        );
      }
    } else {
      // Insert new row if there are more API matches than seeded rows
      const { error } = await supabase.from("matches").insert({
        phase_id: PHASE_ID,
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_at: kickoffAt,
        external_id: externalId,
        status,
        ...(homeGoals != null && { home_goals_final: homeGoals }),
        ...(awayGoals != null && { away_goals_final: awayGoals }),
      });

      if (error) {
        console.error(`Failed to insert ${homeTeam} vs ${awayTeam}:`, error.message);
      } else {
        console.log(`✓ Inserted → ${homeTeam} vs ${awayTeam} @ ${kickoffAt}`);
      }
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
