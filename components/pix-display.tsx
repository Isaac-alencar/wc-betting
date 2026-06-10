"use client";

import { useState } from "react";

interface PixDisplayProps {
  pixKey: string;
  amount: number;
  phaseName: string;
  bets: Array<{ home_team: string; away_team: string; home: number; away: number }>;
}

export default function PixDisplay({ pixKey, amount, phaseName, bets }: PixDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* PIX key card */}
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--muted)] mb-1">Chave PIX</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 font-mono text-[var(--foreground)] break-all text-sm">
            {pixKey}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--muted)] mb-1">Valor a pagar</p>
        <p className="text-3xl font-black text-[var(--accent)]">
          R$ {amount.toFixed(2).replace(".", ",")}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">{phaseName}</p>
      </div>

      {/* Instructions */}
      <p className="text-sm text-[var(--muted)] text-center">
        Faça o pagamento e aguarde a confirmação do admin.
        Você receberá a confirmação em até 24h.
      </p>

      {/* Bets collapsible */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <span>Meus palpites</span>
          <span>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="px-5 pb-4 space-y-2 border-t border-[var(--border)]">
            {bets.map((bet, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">
                  {bet.home_team} × {bet.away_team}
                </span>
                <span className="font-semibold text-[var(--foreground)]">
                  {bet.home} – {bet.away}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
