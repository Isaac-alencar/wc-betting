import { createAdminClient, createAuthAdminClient } from "@/lib/supabase/admin";
import ParticipantRow from "@/components/admin/participant-row";

export const revalidate = 0;

export default async function PagamentosPage() {
  const adminClient = createAdminClient();
  const authClient = createAuthAdminClient();

  const [usersResult, betsResult, paymentsResult, profilesResult] = await Promise.all([
    authClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from("bets").select("user_id"),
    adminClient
      .from("payments")
      .select("user_id, id, phase_id, status, created_at, phases(name)"),
    adminClient.from("user_profiles").select("id, display_name"),
  ]);

  const authUsers = usersResult.data?.users ?? [];
  const bets = betsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  type PaymentEntry = {
    user_id: string;
    id: string;
    phase_id: string;
    status: string;
    created_at: string;
    phases: { name: string } | null;
  };

  const betCountByUser = bets.reduce<Record<string, number>>(
    (acc, b) => { acc[b.user_id] = (acc[b.user_id] ?? 0) + 1; return acc; },
    {}
  );
  const paymentByUser = Object.fromEntries(
    (payments as unknown as PaymentEntry[]).map((p) => [p.user_id, p])
  );
  const displayNameById = Object.fromEntries(
    profiles.map((p) => [p.id, p.display_name])
  );

  // Only show users who placed at least one bet or have a payment record
  const participantIds = new Set([
    ...Object.keys(betCountByUser),
    ...Object.keys(paymentByUser),
  ]);

  const rows = authUsers
    .filter((u) => participantIds.has(u.id))
    .map((u) => {
      const payment = paymentByUser[u.id] ?? null;
      return {
        id: u.id,
        displayName: displayNameById[u.id] ?? u.email?.split("@")[0] ?? "—",
        email: u.email ?? "—",
        betCount: betCountByUser[u.id] ?? 0,
        payment: payment
          ? {
              id: payment.id,
              userId: u.id,
              phaseId: payment.phase_id,
              phaseName: (payment.phases as { name: string } | null)?.name ?? "—",
              status: payment.status as "pending" | "confirmed",
              submittedAt: payment.created_at,
            }
          : null,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const confirmedCount = rows.filter((r) => r.payment?.status === "confirmed").length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Participantes
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {rows.length} participante{rows.length !== 1 ? "s" : ""}
        {" · "}
        {confirmedCount} pagamento{confirmedCount !== 1 ? "s" : ""} confirmado{confirmedCount !== 1 ? "s" : ""}
      </p>

      {rows.length === 0 ? (
        <p className="text-[var(--muted)]">Nenhum participante ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full bg-[var(--surface)]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                <th className="px-4 py-3">Participante</th>
                <th className="px-4 py-3 text-center">Palpites</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ParticipantRow
                  key={row.id}
                  displayName={row.displayName}
                  email={row.email}
                  betCount={row.betCount}
                  payment={row.payment}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
