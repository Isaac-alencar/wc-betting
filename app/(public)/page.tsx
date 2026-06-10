import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOpenPhase } from "@/lib/data/phases";
import { getMatchesForPhase } from "@/lib/data/matches";
import { getUserPayment } from "@/lib/data/payments";
import { getUserBetsForMatches } from "@/lib/data/bets";
import MatchCard from "@/components/match-card";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const phase = await getOpenPhase();

  if (!phase) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[var(--accent)] mb-2">BOLÃO</h1>
          <p className="text-[var(--muted)]">Copa do Mundo 2026 · Brasil</p>
          <p className="mt-8 text-[var(--foreground)]">
            Nenhuma rodada aberta no momento.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Aguarde a abertura da próxima fase.
          </p>
          {user && (
            <Link
              href="/ranking"
              className="mt-6 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Ver ranking →
            </Link>
          )}
        </div>
      </main>
    );
  }

  const matches = await getMatchesForPhase(phase.id);
  const matchIds = matches.map((m) => m.id);
  const payment = user ? await getUserPayment(user.id, phase.id) : null;
  const bets = user ? await getUserBetsForMatches(user.id, matchIds) : [];
  const betsByMatchId = Object.fromEntries(
    bets.map((b) => [
      b.match_id,
      { home: b.home_goals_predicted, away: b.away_goals_predicted },
    ])
  );

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--accent)]">BOLÃO</h1>
            <p className="text-sm text-[var(--muted)]">{phase.name}</p>
          </div>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link href="/ranking" className="hover:text-[var(--foreground)] transition-colors">
              Ranking
            </Link>
            {user ? (
              <Link href="/apostas" className="hover:text-[var(--foreground)] transition-colors">
                Palpites
              </Link>
            ) : (
              <Link href="/login" className="hover:text-[var(--foreground)] transition-colors">
                Entrar
              </Link>
            )}
          </nav>
        </div>

        {/* Match cards */}
        <div className="space-y-4 mb-8">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              bet={betsByMatchId[match.id] ?? null}
            />
          ))}
        </div>

        {/* State-based CTA */}
        {!user && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--foreground)] font-semibold mb-3">
              Faça login para participar
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              Entrar / Cadastrar
            </Link>
          </div>
        )}

        {user && !payment && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Rodada aberta para palpites
            </p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Entrada: R$ {Number(phase.pix_amount).toFixed(2).replace(".", ",")}
            </p>
            <Link
              href="/apostas"
              className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              Fazer Palpites
            </Link>
          </div>
        )}

        {user && payment?.status === "pending" && (
          <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--warning)] font-semibold mb-1">
              Aguardando confirmação do pagamento
            </p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Seu PIX foi enviado? O admin irá confirmar em breve.
            </p>
            <Link
              href="/pagamento"
              className="inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Ver tela de pagamento →
            </Link>
          </div>
        )}

        {user && payment?.status === "confirmed" && (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--accent)] font-semibold mb-1">
              ✓ Palpites confirmados!
            </p>
            <p className="text-sm text-[var(--muted)]">
              Seus palpites estão travados. Boa sorte!
            </p>
            <Link
              href="/ranking"
              className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Ver ranking →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
