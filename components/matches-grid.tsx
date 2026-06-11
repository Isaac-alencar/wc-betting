"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/lib/data/matches";
import MatchCard from "@/components/match-card";
import BetInput from "@/components/bet-input";

type ViewProps = {
  mode: "view";
  betsByMatchId: Record<string, { home: number; away: number }>;
};

type BetProps = {
  mode: "bet";
  existingBetsByMatchId: Record<string, { home_goals_predicted: number; away_goals_predicted: number }>;
};

type MatchesGridProps = {
  matches: Match[];
  columns?: 2 | 3;
} & (ViewProps | BetProps);

export default function MatchesGrid({ matches, columns = 3, ...modeProps }: MatchesGridProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState("");

  const groups = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const m of matches) {
      const g = m.group_name ?? "Outros";
      if (!seen.has(g)) { seen.add(g); result.push(g); }
    }
    return result.sort();
  }, [matches]);

  const filtered = useMemo(() => {
    const search = teamSearch.toLowerCase().trim();
    return matches.filter((m) => {
      if (activeGroup && (m.group_name ?? "Outros") !== activeGroup) return false;
      if (search) {
        return (
          m.home_team.toLowerCase().includes(search) ||
          m.away_team.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [matches, activeGroup, teamSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const g = m.group_name ?? "Outros";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const gridClass =
    columns === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "grid grid-cols-1 sm:grid-cols-2 gap-3";

  function renderMatch(match: Match) {
    if (modeProps.mode === "bet") {
      const existing = modeProps.existingBetsByMatchId[match.id] ?? null;
      return (
        <BetInput
          match={match}
          existingBet={existing}
        />
      );
    }
    return (
      <MatchCard
        match={match}
        bet={modeProps.betsByMatchId[match.id] ?? null}
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveGroup(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeGroup === null
                ? "bg-[var(--accent)] text-black"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            Todos
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                activeGroup === g
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
              }`}
            >
              {g.replace("Grupo ", "")}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          placeholder="Buscar seleção..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Grouped sections */}
      {grouped.length === 0 ? (
        <p className="text-center text-[var(--muted)] py-10">Nenhuma partida encontrada.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([group, groupMatches]) => (
            <section key={group}>
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-3 px-1">
                {group}
              </h2>
              <div className={gridClass}>
                {groupMatches.map((match) => (
                  <div key={match.id}>{renderMatch(match)}</div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
