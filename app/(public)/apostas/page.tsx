import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOpenPhase } from "@/lib/data/phases";
import { getMatchesForPhase } from "@/lib/data/matches";
import { getUserPayment } from "@/lib/data/payments";
import { getUserBetsForMatches } from "@/lib/data/bets";
import MatchesGrid from "@/components/matches-grid";
import { DisplayNameModal } from "@/components/display-name-modal";
import { submitBets } from "@/actions/bets";

const GROUP_STAGE_PHASE_ID = "00000000-0000-0000-0000-000000000010";

export default async function ApostasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const phase = await getOpenPhase();

  if (!phase) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[var(--foreground)] font-semibold">
            Nenhuma rodada aberta no momento.
          </p>
        </div>
        {!profile && <DisplayNameModal />}
      </main>
    );
  }

  const payment = await getUserPayment(user.id, phase.id);

  if (payment?.status === "confirmed") {
    redirect("/");
  }

  const matches = await getMatchesForPhase(GROUP_STAGE_PHASE_ID);
  const existingBets = await getUserBetsForMatches(
    user.id,
    matches.map((m) => m.id)
  );
  const betByMatchId = Object.fromEntries(
    existingBets.map((b) => [
      b.match_id,
      { home_goals_predicted: b.home_goals_predicted, away_goals_predicted: b.away_goals_predicted },
    ])
  );

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      {!profile && <DisplayNameModal />}

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--accent)]">Seus Palpites</h1>
            <p className="text-sm text-[var(--muted)]">
              {phase.name} · R$ {Number(phase.pix_amount).toFixed(2).replace(".", ",")} via PIX
            </p>
          </div>
        </div>

        <form
          action={async (fd) => {
            "use server";
            await submitBets(fd);
          }}
        >
          <MatchesGrid
            matches={matches}
            columns={3}
            mode="bet"
            existingBetsByMatchId={betByMatchId}
          />

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-8 py-4 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors"
            >
              {existingBets.length > 0 ? "Atualizar Palpites" : "Enviar Palpites"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Após enviar, você receberá a chave PIX para pagamento.
          Seus palpites só ficam válidos após confirmação do pagamento.
        </p>
      </div>
    </main>
  );
}
