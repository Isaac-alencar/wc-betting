"use client";

import { useTransition } from "react";
import { confirmPayment } from "@/actions/payments";

interface ParticipantRowProps {
  displayName: string;
  email: string;
  betCount: number;
  payment: {
    id: string;
    userId: string;
    phaseId: string;
    phaseName: string;
    status: "pending" | "confirmed";
    submittedAt: string;
  } | null;
}

export default function ParticipantRow({
  displayName,
  email,
  betCount,
  payment,
}: ParticipantRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!payment) return;
    startTransition(async () => {
      await confirmPayment(payment.id, payment.userId, payment.phaseId);
    });
  }

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="px-4 py-3">
        <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
        <p className="text-xs text-[var(--muted)]">{email}</p>
      </td>
      <td className="px-4 py-3 text-center text-sm text-[var(--foreground)]">
        {betCount}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--muted)]">
        {payment?.phaseName ?? "—"}
      </td>
      <td className="px-4 py-3">
        {!payment ? (
          <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs text-[var(--muted)]">
            Sem pagamento
          </span>
        ) : payment.status === "confirmed" ? (
          <span className="rounded-full bg-[var(--accent)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
            Confirmado
          </span>
        ) : (
          <span className="rounded-full bg-[var(--warning)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--warning)]">
            Aguardando
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {payment?.status === "pending" && (
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
          >
            {isPending ? "..." : "Confirmar PIX"}
          </button>
        )}
      </td>
    </tr>
  );
}
