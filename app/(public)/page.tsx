import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOpenPhase } from "@/lib/data/phases";
import { getMatchesForPhase } from "@/lib/data/matches";
import { getUserPayment } from "@/lib/data/payments";
import { getUserBetsForMatches } from "@/lib/data/bets";
import MatchesGrid from "@/components/matches-grid";

const GROUP_STAGE_PHASE_ID = "00000000-0000-0000-0000-000000000010";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [phase, matches] = await Promise.all([
    getOpenPhase(),
    getMatchesForPhase(GROUP_STAGE_PHASE_ID),
  ]);

  const matchIds = matches.map((m) => m.id);
  const payment =
    user && phase ? await getUserPayment(user.id, phase.id) : null;
  const bets = user ? await getUserBetsForMatches(user.id, matchIds) : [];
  const betsByMatchId = Object.fromEntries(
    bets.map((b) => [
      b.match_id,
      { home: b.home_goals_predicted, away: b.away_goals_predicted },
    ]),
  );

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--accent)]">
              BOLÃO DOS ALENCAR
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Copa do Mundo 2026 · Fase de Grupos
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link
              href="/ranking"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Ranking
            </Link>
            {user ? (
              <Link
                href="/apostas"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Palpites
              </Link>
            ) : (
              <Link
                href="/login"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>

        {/* State-based CTA */}
        {!user && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--foreground)] font-semibold">
              Faça login para participar
            </p>
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              Entrar
            </Link>
          </div>
        )}

        {phase && user && !payment && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Rodada aberta para palpites
              </p>
              <p className="text-xs text-[var(--muted)]">
                Entrada: R${" "}
                {Number(phase.pix_amount).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <Link
              href="/apostas"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              Fazer Palpites
            </Link>
          </div>
        )}

        {user && payment?.status === "pending" && (
          <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--surface)] p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--warning)]">
                Aguardando confirmação do PIX
              </p>
              <p className="text-xs text-[var(--muted)]">
                O admin irá confirmar em breve.
              </p>
            </div>
            <Link
              href="/pagamento"
              className="shrink-0 text-sm text-[var(--accent)] hover:underline"
            >
              Ver pagamento →
            </Link>
          </div>
        )}

        {user && payment?.status === "confirmed" && (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                ✓ Palpites confirmados!
              </p>
              <p className="text-xs text-[var(--muted)]">
                Seus palpites estão travados. Boa sorte!
              </p>
            </div>
            <Link
              href="/ranking"
              className="shrink-0 text-sm text-[var(--accent)] hover:underline"
            >
              Ver ranking →
            </Link>
          </div>
        )}

        {/* Matches grid with group filters */}
        <MatchesGrid
          matches={matches}
          columns={3}
          mode="view"
          betsByMatchId={betsByMatchId}
        />
      </div>
    </main>
  );
}
