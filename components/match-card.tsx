import type { Match } from "@/lib/data/matches";

const STATUS_LABEL: Record<Match["status"], string> = {
  scheduled: "Programado",
  finished: "Encerrado",
  cancelled: "Cancelado",
  postponed: "Adiado",
};

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MatchCardProps {
  match: Match;
  bet?: { home: number; away: number } | null;
}

export default function MatchCard({ match, bet }: MatchCardProps) {
  const isFinished = match.status === "finished";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      {/* Teams row */}
      <div className="flex items-center justify-between gap-4">
        <span className="flex-1 text-right text-lg font-bold text-[var(--foreground)] truncate">
          {match.home_team}
        </span>

        <div className="flex flex-col items-center gap-1 shrink-0">
          {isFinished ? (
            <span className="text-2xl font-black text-[var(--accent)]">
              {match.home_goals_final} – {match.away_goals_final}
            </span>
          ) : (
            <span className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
              vs
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isFinished
                ? "bg-[var(--surface-raised)] text-[var(--muted)]"
                : "bg-[var(--accent-dim)] text-[var(--accent)]"
            }`}
          >
            {STATUS_LABEL[match.status]}
          </span>
        </div>

        <span className="flex-1 text-left text-lg font-bold text-[var(--foreground)] truncate">
          {match.away_team}
        </span>
      </div>

      {/* Kickoff time */}
      <p className="mt-3 text-center text-sm text-[var(--muted)]">
        {formatKickoff(match.kickoff_at)}
      </p>

      {/* User's bet (if any) */}
      {bet != null && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] text-center">
          <span className="text-xs text-[var(--muted)]">Seu palpite: </span>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {bet.home} × {bet.away}
          </span>
        </div>
      )}
    </div>
  );
}
