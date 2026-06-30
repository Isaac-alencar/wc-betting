const BASE = "https://api.football-data.org/v4";
const BRAZIL_TEAM_ID = 764;
const WC_COMPETITION = "WC";

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  externalId: string;
}

interface ApiMatch {
  id: number;
  status: string;
  stage: string;
  utcDate: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
}

export interface FinishedMatch {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

interface ApiMatchWithScore extends ApiMatch {
  score: { fullTime: { home: number | null; away: number | null } };
}

export async function fetchFinishedWCMatches(): Promise<FinishedMatch[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set.");

  const res = await fetch(
    `${BASE}/competitions/${WC_COMPETITION}/matches?season=2026&status=FINISHED`,
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
  );

  if (!res.ok) throw new Error(`football-data.org API error: ${res.status} ${res.statusText}`);

  const { matches } = (await res.json()) as { matches: ApiMatchWithScore[] };

  return matches
    .filter(
      (m): m is ApiMatchWithScore & { homeTeam: { name: string }; awayTeam: { name: string } } =>
        m.homeTeam.name != null &&
        m.awayTeam.name != null &&
        m.score.fullTime.home != null &&
        m.score.fullTime.away != null
    )
    .map((m) => ({
      externalId: String(m.id),
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeGoals: m.score.fullTime.home as number,
      awayGoals: m.score.fullTime.away as number,
    }));
}

export async function fetchBrazilNextMatch(): Promise<MatchResult | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set.");

  const url = `${BASE}/competitions/${WC_COMPETITION}/matches?season=2026&status=SCHEDULED,TIMED`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`football-data.org API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { matches: ApiMatch[] };

  const brazilMatch = json.matches
    .slice()
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .find((m) => {
      if (m.status !== "SCHEDULED" && m.status !== "TIMED") return false;
      const home = m.homeTeam.name?.toLowerCase() ?? "";
      const away = m.awayTeam.name?.toLowerCase() ?? "";
      return (
        home.includes("brazil") || home.includes("brasil") ||
        away.includes("brazil") || away.includes("brasil")
      );
    });

  if (!brazilMatch || !brazilMatch.homeTeam.name || !brazilMatch.awayTeam.name) return null;

  return {
    homeTeam: brazilMatch.homeTeam.name,
    awayTeam: brazilMatch.awayTeam.name,
    kickoffAt: brazilMatch.utcDate,
    externalId: String(brazilMatch.id),
  };
}

export async function fetchMatchesByStage(stageCode: string): Promise<MatchResult[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set.");

  // The API does not support ?stage= as a filter — fetch all and filter in-process
  const res = await fetch(
    `${BASE}/competitions/${WC_COMPETITION}/matches?season=2026`,
    { headers: { "X-Auth-Token": apiKey }, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    throw new Error(`football-data.org API error: ${res.status} ${res.statusText}`);
  }

  const { matches } = (await res.json()) as { matches: ApiMatch[] };

  return matches
    .filter(
      (m): m is ApiMatch & { homeTeam: { name: string }; awayTeam: { name: string } } =>
        m.stage === stageCode &&
        m.homeTeam.name != null &&
        m.awayTeam.name != null
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .map((m) => ({
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      kickoffAt: m.utcDate,
      externalId: String(m.id),
    }));
}
