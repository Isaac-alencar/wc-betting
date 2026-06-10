-- ============================================================
-- 002_seed_group_stage.sql
-- WC 2026 — championship, group stage phase, and Brazil's
-- 3 group stage matches (Group E: Mexico, USA, Canada hosting).
-- Brazil group opponents: TBD from draw — update before launch.
-- ============================================================

-- Championship
insert into championships (id, name, season, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'Copa do Mundo 2026',
  '2026',
  'active'
)
on conflict (id) do nothing;

-- Group Stage phase (starts closed — admin opens when ready)
insert into phases (id, championship_id, name, status, pix_amount)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Fase de Grupos',
  'closed',
  20.00
)
on conflict (id) do nothing;

-- Brazil group stage matches
-- NOTE: Opponents, dates, and kickoff times are placeholders.
-- Update with confirmed draw results before opening the app.
insert into matches (id, phase_id, home_team, away_team, kickoff_at, status)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000010',
    'Brasil',
    'Adversário 1',
    '2026-06-14 18:00:00+00',
    'scheduled'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000010',
    'Brasil',
    'Adversário 2',
    '2026-06-19 21:00:00+00',
    'scheduled'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000010',
    'Adversário 3',
    'Brasil',
    '2026-06-23 21:00:00+00',
    'scheduled'
  )
on conflict (id) do nothing;
