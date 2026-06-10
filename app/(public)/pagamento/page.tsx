import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserPayment } from "@/lib/data/payments";
import { getUserBetsForMatches } from "@/lib/data/bets";
import { getMatchesForPhase } from "@/lib/data/matches";
import PixDisplay from "@/components/pix-display";
import PixAutoRefresh from "@/components/pix-auto-refresh";

export default async function PagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const { phase: phaseId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find the phase — use query param or fall back to current open/locked phase
  let resolvedPhaseId = phaseId;
  if (!resolvedPhaseId) {
    const { data: ph } = await supabase
      .from("phases")
      .select("id")
      .in("status", ["open", "betting_locked"])
      .maybeSingle();
    resolvedPhaseId = ph?.id;
  }

  if (!resolvedPhaseId) redirect("/");

  const payment = await getUserPayment(user.id, resolvedPhaseId);

  if (!payment) redirect("/");

  // Show success state
  if (payment.status === "confirmed") {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-[var(--accent)] mb-2">
            Palpites confirmados!
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Seus palpites estão registrados. Boa sorte!
          </p>
          <Link
            href="/ranking"
            className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
          >
            Ver Ranking
          </Link>
        </div>
      </main>
    );
  }

  // Pending state — fetch bets + matches for display
  const { data: phase } = await supabase
    .from("phases")
    .select("name, pix_amount")
    .eq("id", resolvedPhaseId)
    .single();

  const matches = await getMatchesForPhase(resolvedPhaseId);
  const bets = await getUserBetsForMatches(
    user.id,
    matches.map((m) => m.id)
  );

  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  const betDisplay = bets.map((b) => ({
    home_team: matchById[b.match_id]?.home_team ?? "",
    away_team: matchById[b.match_id]?.away_team ?? "",
    home: b.home_goals_predicted,
    away: b.away_goals_predicted,
  }));

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? "PIX não configurado";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-[var(--foreground)]">
            Pagamento via PIX
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Aguardando confirmação do admin
          </p>
        </div>

        <PixDisplay
          pixKey={pixKey}
          amount={Number(phase?.pix_amount ?? 0)}
          phaseName={phase?.name ?? ""}
          bets={betDisplay}
        />
      </div>

      {/* Auto-refresh every 30s to detect confirmation */}
      <PixAutoRefresh />
    </main>
  );
}
