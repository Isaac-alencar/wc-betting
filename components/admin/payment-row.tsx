"use client";

import { useTransition } from "react";
import { confirmPayment } from "@/actions/payments";

interface PaymentRowProps {
  paymentId: string;
  userId: string;
  phaseId: string;
  displayName: string;
  phaseName: string;
  submittedAt: string;
}

export default function PaymentRow({
  paymentId,
  userId,
  phaseId,
  displayName,
  phaseName,
  submittedAt,
}: PaymentRowProps) {
  const [isPending, startTransition] = useTransition();

  const date = new Date(submittedAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleConfirm() {
    startTransition(async () => {
      await confirmPayment(paymentId, userId, phaseId);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div>
        <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
        <p className="text-sm text-[var(--muted)]">
          {phaseName} · {date}
        </p>
      </div>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
      >
        {isPending ? "Confirmando..." : "Confirmar PIX"}
      </button>
    </div>
  );
}
