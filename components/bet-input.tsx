"use client";

import type { Match } from "@/lib/data/matches";
import type { Bet } from "@/lib/data/bets";

interface BetInputProps {
  match: Match;
  existingBet?: Bet | null;
}

export default function BetInput({ match, existingBet }: BetInputProps) {
  const kickoff = new Date(match.kickoff_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs text-[var(--muted)] text-center mb-4">{kickoff}</p>

      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-[var(--foreground)] text-center leading-tight">
            {match.home_team}
          </span>
          <input
            type="number"
            name={`home_${match.id}`}
            min={0}
            step={1}
            defaultValue={existingBet?.home_goals_predicted ?? ""}
            required
            className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-2 text-center text-xl font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="0"
          />
        </div>

        <span className="text-xl font-bold text-[var(--muted)] shrink-0">×</span>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-[var(--foreground)] text-center leading-tight">
            {match.away_team}
          </span>
          <input
            type="number"
            name={`away_${match.id}`}
            min={0}
            step={1}
            defaultValue={existingBet?.away_goals_predicted ?? ""}
            required
            className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-2 text-center text-xl font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
