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
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

export async function fetchBrazilNextMatch(): Promise<MatchResult | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not set.");

  const url = `${BASE}/competitions/${WC_COMPETITION}/matches?season=2026&status=SCHEDULED`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`football-data.org API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { matches: ApiMatch[] };

  const brazilMatch = json.matches.find(
    (m) =>
      m.status === "SCHEDULED" &&
      (m.homeTeam.name.toLowerCase().includes("brazil") ||
        m.awayTeam.name.toLowerCase().includes("brazil") ||
        m.homeTeam.name.toLowerCase().includes("brasil") ||
        m.awayTeam.name.toLowerCase().includes("brasil"))
  );

  if (!brazilMatch) return null;

  return {
    homeTeam: brazilMatch.homeTeam.name,
    awayTeam: brazilMatch.awayTeam.name,
    kickoffAt: brazilMatch.utcDate,
    externalId: String(brazilMatch.id),
  };
}
