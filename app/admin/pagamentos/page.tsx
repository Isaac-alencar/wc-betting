import { getPendingPayments } from "@/lib/data/payments";
import PaymentRow from "@/components/admin/payment-row";

export default async function PagamentosPage() {
  const payments = await getPendingPayments();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Confirmar Pagamentos
      </h1>

      {payments.length === 0 ? (
        <p className="text-[var(--muted)]">Nenhum pagamento pendente.</p>
      ) : (
        <div className="space-y-3 max-w-xl">
          {payments.map((p) => (
            <PaymentRow
              key={p.id}
              paymentId={p.id}
              userId={p.user_id}
              phaseId={p.phase_id}
              displayName={p.user_profiles?.display_name ?? "Anônimo"}
              phaseName={p.phases.name}
              submittedAt={p.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
