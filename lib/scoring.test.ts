import { describe, it, expect } from "vitest";
import { calculatePoints } from "./scoring";

describe("calculatePoints", () => {
  it("returns 5 for exact score", () => {
    expect(calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe(5);
  });

  it("returns 5 for exact 0-0", () => {
    expect(calculatePoints({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(5);
  });

  it("returns 3 for correct result — home win", () => {
    expect(calculatePoints({ home: 3, away: 1 }, { home: 1, away: 0 })).toBe(3);
  });

  it("returns 3 for correct result — draw", () => {
    expect(calculatePoints({ home: 1, away: 1 }, { home: 0, away: 0 })).toBe(3);
  });

  it("returns 3 for correct result — away win", () => {
    expect(calculatePoints({ home: 0, away: 2 }, { home: 1, away: 3 })).toBe(3);
  });

  it("returns 1 for partial — home goals match", () => {
    // Home win predicted, away win actual; home goals match (2=2)
    expect(calculatePoints({ home: 2, away: 1 }, { home: 2, away: 3 })).toBe(1);
  });

  it("returns 1 for partial — away goals match", () => {
    // Home win predicted, away win actual; away goals match (1=1)
    expect(calculatePoints({ home: 2, away: 1 }, { home: 0, away: 1 })).toBe(1);
  });

  it("returns 0 for complete miss", () => {
    expect(calculatePoints({ home: 3, away: 0 }, { home: 0, away: 2 })).toBe(0);
  });

  it("correct result takes priority over partial — 3 not 1", () => {
    // 2-1 predicted (home win), 3-1 actual (home win); away goals both = 1, but result wins
    expect(calculatePoints({ home: 2, away: 1 }, { home: 3, away: 1 })).toBe(3);
  });
});
