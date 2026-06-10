-- ============================================================
-- 001_initial_schema.sql
-- WC Brazil Bolão — all tables, constraints, RLS policies,
-- and the confirm_payment RPC for atomic payment locking.
-- ============================================================

-- ------------------------------------------------------------
-- championships
-- ------------------------------------------------------------
create table championships (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  season       text not null,
  status       text not null default 'not_started'
                 check (status in ('not_started', 'active', 'ended')),
  created_at   timestamptz not null default now()
);

alter table championships enable row level security;

create policy "championships_public_read"
  on championships for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- phases
-- ------------------------------------------------------------
create table phases (
  id                uuid primary key default gen_random_uuid(),
  championship_id   uuid not null references championships on delete cascade,
  name              text not null,
  status            text not null default 'closed'
                      check (status in ('closed', 'open', 'betting_locked', 'finished')),
  pix_amount        numeric(10, 2) not null,
  created_at        timestamptz not null default now()
);

alter table phases enable row level security;

create policy "phases_public_read"
  on phases for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- matches
-- ------------------------------------------------------------
create table matches (
  id                  uuid primary key default gen_random_uuid(),
  phase_id            uuid not null references phases on delete cascade,
  home_team           text not null,
  away_team           text not null,
  kickoff_at          timestamptz not null,
  home_goals_final    int check (home_goals_final >= 0),
  away_goals_final    int check (away_goals_final >= 0),
  status              text not null default 'scheduled'
                        check (status in ('scheduled', 'finished', 'cancelled', 'postponed')),
  external_id         text,
  created_at          timestamptz not null default now()
);

alter table matches enable row level security;

create policy "matches_public_read"
  on matches for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- user_profiles
-- ------------------------------------------------------------
create table user_profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  created_at    timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "profiles_read_authenticated"
  on user_profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- bets
-- ------------------------------------------------------------
create table bets (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users on delete cascade,
  match_id                uuid not null references matches on delete cascade,
  home_goals_predicted    int not null check (home_goals_predicted >= 0),
  away_goals_predicted    int not null check (away_goals_predicted >= 0),
  status                  text not null default 'pending'
                            check (status in ('pending', 'confirmed', 'scored')),
  points                  int,
  created_at              timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table bets enable row level security;

-- Users can read their own bets
create policy "bets_read_own"
  on bets for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can read all scored bets (for ranking display)
create policy "bets_read_scored"
  on bets for select
  to authenticated
  using (status = 'scored');

-- Users can insert their own bets when phase is open
create policy "bets_insert_own"
  on bets for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from matches m
      join phases p on p.id = m.phase_id
      where m.id = match_id
        and p.status = 'open'
    )
  );

-- Users can update their own pending bets only
create policy "bets_update_own_pending"
  on bets for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
create table payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  phase_id      uuid not null references phases on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'confirmed')),
  confirmed_at  timestamptz,
  confirmed_by  uuid references auth.users,
  created_at    timestamptz not null default now(),
  unique (user_id, phase_id)
);

alter table payments enable row level security;

create policy "payments_read_own"
  on payments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "payments_insert_own"
  on payments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- confirm_payment RPC (atomic: payment + bets in one transaction)
-- Called with the service role key from the admin Server Action.
-- ------------------------------------------------------------
create or replace function confirm_payment(
  p_payment_id  uuid,
  p_user_id     uuid,
  p_phase_id    uuid,
  p_admin_id    uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- Update payment status
  update payments
     set status        = 'confirmed',
         confirmed_at  = now(),
         confirmed_by  = p_admin_id
   where id = p_payment_id
     and status = 'pending';

  if not found then
    raise exception 'payment_not_found_or_already_confirmed';
  end if;

  -- Lock all bets for this user in this phase
  update bets
     set status = 'confirmed'
   where user_id  = p_user_id
     and match_id in (
       select id from matches where phase_id = p_phase_id
     )
     and status = 'pending';
end;
$$;
