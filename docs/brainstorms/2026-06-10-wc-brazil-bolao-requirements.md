# WC Brazil Bolão — Requirements

**Date:** 2026-06-10
**Status:** Ready for planning

---

## What We're Building

A web-based bolão (pool betting) for Brazil's World Cup games. Participants predict match scores, pay via PIX, and compete for a prize pot split among the top 3. The admin (single user) controls all phases: opening betting windows, confirming payments, entering results, and triggering score calculations.

---

## Primary Actors

| Actor | Description |
|---|---|
| **Participant** | Any signed-in user (email or anonymous). Places score predictions and pays via PIX. |
| **Admin** | The app owner. Controls tournament phases, confirms payments, enters results. |

---

## Core Outcome

A participant can place bets for Brazil's current phase, pay via PIX, and watch the ranking update as results come in — all without any backend infrastructure beyond Supabase. The admin runs the whole cycle from a single admin panel.

---

## Key Entities

| Entity | Key fields |
|---|---|
| `championship` | name, season, status (not_started / active / ended) |
| `phase` | championship_id, name (e.g. "Group Stage"), status (closed / open / betting_locked / finished) |
| `match` | phase_id, home_team, away_team, kickoff_at, home_goals_final, away_goals_final, status (scheduled / finished / cancelled / postponed) |
| `user` | supabase auth user, display_name, email (optional), is_admin |
| `bet` | user_id, match_id, home_goals_predicted, away_goals_predicted, status (pending / confirmed / scored), points |
| `payment` | user_id, phase_id, status (pending / confirmed), confirmed_at |

---

## Flows

### Participant: Placing Bets and Paying

1. Sign up with email or anonymous auth.
2. View open phase — see all of Brazil's matches for that phase.
3. Submit score predictions for each match (both teams' goals, integers ≥ 0).
4. After submitting all bets, app shows the static PIX key and a "waiting for confirmation" state.
5. Participant pays externally and waits.
6. Once the admin confirms the payment, all bets for that phase lock permanently. No further edits.
7. As results come in, participant's points appear on the ranking.

### Admin: Running a Phase

1. Open a new betting phase.
   - **Group stage:** matches are pre-seeded in the database (Brazil's 3 group games are known before the tournament).
   - **Knockout phases:** admin triggers a "fetch next game" action that calls a public football API to pull Brazil's next match (opponent, date, venue) and creates the match record automatically.
2. Monitor pending payments list — confirm each participant's PIX payment manually.
3. After a match ends, enter the final result (home goals, away goals).
4. Trigger score calculation for that match. Points update; ranking recalculates.
5. Close the phase when all matches are done, then open the next one.

---

## Scoring Rules

| Outcome | Points | Condition |
|---|---|---|
| Exact score | 5 | Predicted both teams' goals correctly |
| Correct result | 3 | Correct winner or draw, but not exact score |
| Partial | 1 | One team's goals correct |
| Wrong | 0 | Neither condition met |
| No bet | 0 | Participant did not bet on this match |

Exact score takes precedence; scoring is not cumulative (highest tier applies).

---

## Ranking

- **Ordered by:** total points (desc) → exact score count (desc) → date of first confirmed bet (asc)
- **Only confirmed participants** (payment confirmed by admin) appear in the ranking.
- **Prize split:** top 3 share the pot 60 / 30 / 10%.

---

## Bet State Machine

```
placed → pending  (user submitted bets, payment not yet confirmed)
pending → confirmed  (admin confirms PIX payment → bets lock)
confirmed → scored  (admin enters result and triggers calculation)
```

Bets in `pending` state are locked from editing but not yet counted in ranking. Bets are never unlocked after confirmation.

---

## Authentication

- **Email auth:** Supabase built-in email/password. Persistent across devices.
- **Anonymous auth:** Supabase anonymous sign-in. Full participant — can bet, appear in ranking. Account is browser/device bound.
  - App must display a prominent notice to anonymous users recommending they link an email to avoid losing their account.

---

## Admin Panel

Single admin user (set via Supabase role or a hardcoded email check). Admin panel at `/admin`, protected by server-side auth check.

Admin capabilities:
- Create/manage championship and phases
- Add matches to a phase
- View pending payments; confirm each one
- Enter match results
- Trigger score calculation per match
- View full ranking

---

## PIX Payment

- Static PIX key (hardcoded in env variable).
- Amount per participant per phase is defined by the admin (shown alongside the PIX key, can be stored per-phase or env variable for v1).
- No automatic payment detection. Admin confirms manually.
- App shows PIX key + amount on a dedicated "payment pending" screen after bets are submitted.

---

## UI Constraints

- **Aesthetic:** Blaze-inspired (blaze.com betting/gaming site) — dark background, high contrast, vibrant accent colors, bold typography, card-based match layouts. Energetic sports-betting feel, not a minimal admin panel.
- **Styling:** Tailwind CSS only. No component libraries.
- **Component size:** Each component does one thing. Pages are thin orchestration layers over small components.
- **Language:** Portuguese (Brazilian). All UI copy in pt-BR.

---

## Technical Constraints

- **Framework:** Next.js (App Router)
- **Backend/DB:** Supabase (PostgreSQL + Auth)
- **Language:** TypeScript strict mode
- **Package manager:** pnpm
- **Data access:** Small, isolated functions with a single well-defined scope. No fat query files.
- **No ORM** beyond Supabase's typed client.

---

## Scope Boundaries

**Included:**
- Brazil's games only (7–8 matches across phases)
- Email + anonymous auth
- PIX payment with manual admin confirmation
- Phase-based betting (admin opens each phase)
- 60/30/10 top-3 prize split
- Score prediction (goals per team)
- Single championship instance (WC 2026)
- Group stage matches pre-seeded in the database
- Admin-triggered API fetch for knockout stage matches (public football API)

**Excluded:**
- Automatic PIX detection or webhooks
- Private leagues or invite links
- Push/email notifications
- Automatic/scheduled match import (import is always admin-triggered)
- Per-round prize distribution
- Mobile app

---

## Outstanding Questions

- **Entry fee amount:** Fixed per-tournament or per-phase? For v1, suggest a single env variable (`PIX_AMOUNT`) — admin communicates amount out-of-band (WhatsApp, etc.).
- **Anonymous display name:** How does an anonymous user set their display name in the ranking? Prompt on first bet submission.
- **Tie in prize split:** If two participants tie for 3rd, how is the 10% handled? Not specified — flag for admin to decide manually or pool and split equally.
