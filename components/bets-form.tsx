"use client";

import { useActionState } from "react";
import { submitBets } from "@/actions/bets";

interface BetsFormProps {
  children: React.ReactNode;
  existingBetsCount: number;
}

export default function BetsForm({ children, existingBetsCount }: BetsFormProps) {
  const [state, action, isPending] = useActionState(submitBets, null);

  return (
    <form action={action}>
      {children}

      {state?.error && (
        <p className="mt-6 text-center text-sm font-semibold text-red-400">
          {state.error}
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[var(--accent)] px-8 py-4 font-bold text-black hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Salvando..."
            : existingBetsCount > 0
            ? "Atualizar Palpites"
            : "Enviar Palpites"}
        </button>
      </div>
    </form>
  );
}
