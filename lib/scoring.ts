function sign(n: number): -1 | 0 | 1 {
  if (n > 0) return 1;
  if (n < 0) return -1;
  return 0;
}

export function calculatePoints(
  predicted: { home: number; away: number },
  actual: { home: number; away: number }
): number {
  // Tier 1: exact score
  if (predicted.home === actual.home && predicted.away === actual.away) return 5;

  const predictedResult = sign(predicted.home - predicted.away);
  const actualResult = sign(actual.home - actual.away);

  // Tier 2: correct winner / draw
  if (predictedResult === actualResult) return 3;

  // Tier 3: one team's goals correct
  if (predicted.home === actual.home || predicted.away === actual.away) return 1;

  // Miss
  return 0;
}
