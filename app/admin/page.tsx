import { createClient } from "@/lib/supabase/server";

async function getDashboardCounts() {
  const supabase = await createClient();
  const [phases, payments, matches, bets] = await Promise.all([
    supabase.from("phases").select("id", { count: "exact" }).eq("status", "open"),
    supabase.from("payments").select("id", { count: "exact" }).eq("status", "pending"),
    supabase.from("matches").select("id", { count: "exact" }).eq("status", "scheduled"),
    supabase.from("bets").select("id", { count: "exact" }).eq("status", "scored"),
  ]);

  return {
    openPhases: phases.count ?? 0,
    pendingPayments: payments.count ?? 0,
    scheduledMatches: matches.count ?? 0,
    scoredBets: bets.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const counts = await getDashboardCounts();

  const stats = [
    { label: "Fases abertas", value: counts.openPhases, accent: true },
    { label: "Pagamentos pendentes", value: counts.pendingPayments, accent: counts.pendingPayments > 0 },
    { label: "Partidas agendadas", value: counts.scheduledMatches, accent: false },
    { label: "Palpites pontuados", value: counts.scoredBets, accent: false },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {stats.map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm text-[var(--muted)] mb-1">{label}</p>
            <p
              className={`text-3xl font-black ${
                accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
