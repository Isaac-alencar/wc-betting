const MEDALS = ["🥇", "🥈", "🥉"];

interface RankingEntry {
  display_name: string;
  total_points: number;
  exact_scores: number;
  prize: number | null;
}

export default function RankingTable({ entries }: { entries: RankingEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-[var(--muted)] py-12">
        Nenhum participante confirmado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
            <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">#</th>
            <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">Participante</th>
            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Pts</th>
            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Exatos</th>
            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Prêmio</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={i}
              className={`border-b border-[var(--border)] last:border-0 ${
                i === 0
                  ? "bg-[var(--accent-dim)]"
                  : "bg-[var(--surface)]"
              }`}
            >
              <td className="px-4 py-3 text-[var(--muted)]">
                {MEDALS[i] ?? i + 1}
              </td>
              <td
                className={`px-4 py-3 font-semibold ${
                  i === 0
                    ? "text-[var(--accent)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {entry.display_name}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[var(--foreground)]">
                {entry.total_points}
              </td>
              <td className="px-4 py-3 text-right text-[var(--muted)]">
                {entry.exact_scores}
              </td>
              <td className="px-4 py-3 text-right text-[var(--foreground)]">
                {entry.prize != null
                  ? `R$ ${entry.prize.toFixed(2).replace(".", ",")}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
