import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!;
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!;
const CHAMPIONSHIP_ID = "00000000-0000-0000-0000-000000000001";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET);

const PHASE_MAP: Record<string, { id: string; name: string; pixAmount: number }> = {
  GROUP_STAGE:   { id: "00000000-0000-0000-0000-000000000010", name: "Fase de Grupos",   pixAmount: 20 },
  LAST_32:       { id: "00000000-0000-0000-0000-000000000020", name: "Oitavas de Final",  pixAmount: 20 },
  LAST_16:       { id: "00000000-0000-0000-0000-000000000030", name: "Rodada de 16",      pixAmount: 20 },
  QUARTER_FINALS:{ id: "00000000-0000-0000-0000-000000000040", name: "Quartas de Final",  pixAmount: 20 },
  SEMI_FINALS:   { id: "00000000-0000-0000-0000-000000000050", name: "Semifinais",        pixAmount: 20 },
  THIRD_PLACE:   { id: "00000000-0000-0000-0000-000000000060", name: "Final",             pixAmount: 20 },
  FINAL:         { id: "00000000-0000-0000-0000-000000000060", name: "Final",             pixAmount: 20 },
};

interface ApiMatch {
  id: number;
  status: string;
  stage: string;
  group: string | null;
  utcDate: string;
  homeTeam: { id: number | null; name: string };
  awayTeam: { id: number | null; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

function formatGroupName(raw: string | null): string | null {
  if (!raw) return null;
  // "GROUP_A" → "Grupo A"
  const match = raw.match(/^GROUP_([A-Z]+)$/);
  if (match) return `Grupo ${match[1]}`;
  return raw;
}

function mapStatus(s: string): string {
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED") return "finished"; // treat live as finished for scoring
  return "scheduled";
}

async function main() {
  // 1. Fetch all WC 2026 matches
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": API_KEY } }
  );

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }

  const { matches } = (await res.json()) as { matches: ApiMatch[] };
  console.log(`Fetched ${matches.length} total matches from API`);

  // 2. Upsert phases
  const seenPhaseIds = new Set<string>();
  for (const m of matches) {
    const phase = PHASE_MAP[m.stage];
    if (!phase || seenPhaseIds.has(phase.id)) continue;
    seenPhaseIds.add(phase.id);

    const { error } = await supabase.from("phases").upsert(
      {
        id: phase.id,
        championship_id: CHAMPIONSHIP_ID,
        name: phase.name,
        status: "closed",
        pix_amount: phase.pixAmount,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (error) console.error(`Phase upsert error (${phase.name}):`, error.message);
    else console.log(`✓ Phase: ${phase.name}`);
  }

  // 3. Upsert matches (keyed by external_id)
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of matches) {
    const phase = PHASE_MAP[m.stage];
    if (!phase) {
      console.log(`  Skipping unknown stage: ${m.stage}`);
      skipped++;
      continue;
    }

    const homeGoals = m.score.fullTime.home;
    const awayGoals = m.score.fullTime.away;
    const status = mapStatus(m.status);

    // Skip matches where teams aren't determined yet
    if (!m.homeTeam.name || !m.awayTeam.name) {
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      phase_id: phase.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      kickoff_at: m.utcDate,
      external_id: String(m.id),
      status,
      group_name: formatGroupName(m.group),
    };
    if (homeGoals != null) payload.home_goals_final = homeGoals;
    if (awayGoals != null) payload.away_goals_final = awayGoals;

    // Check if exists by external_id
    const { data: existing } = await supabase
      .from("matches")
      .select("id")
      .eq("external_id", String(m.id))
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("matches")
        .update(payload)
        .eq("id", existing.id);
      if (error) console.error(`Update error [${m.id}]:`, error.message);
      else updated++;
    } else {
      const { error } = await supabase.from("matches").insert(payload);
      if (error) console.error(`Insert error [${m.id}]:`, error.message);
      else inserted++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${updated} updated, ${skipped} skipped`);
}

main().catch((e) => { console.error(e); process.exit(1); });
