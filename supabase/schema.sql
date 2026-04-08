create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  country_code text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.rank_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  player_deck text,
  opponent_deck text not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  queue_type text not null default 'Ranked',
  first_player boolean,
  notes text,
  rank_tier text,
  version_code text,
  created_at timestamptz not null default now()
);

alter table public.rank_logs add column if not exists player_deck text;
alter table public.rank_logs add column if not exists version_code text;

create index if not exists rank_logs_user_created_at_idx
  on public.rank_logs (user_id, created_at desc);

create index if not exists rank_logs_matchup_idx
  on public.rank_logs (user_id, player_deck, opponent_deck);

create index if not exists rank_logs_version_idx
  on public.rank_logs (version_code);

create table if not exists public.trade_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  offer_cards text[] not null default '{}',
  want_cards text[] not null default '{}',
  notes text,
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.deck_discussions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deck_key text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace view public.rank_matchup_rollups as
select
  rl.user_id,
  p.handle,
  p.display_name,
  p.country_code,
  coalesce(nullif(rl.version_code, ''), 'all') as version_code,
  rl.queue_type,
  coalesce(nullif(rl.player_deck, ''), 'Unknown deck') as player_deck,
  coalesce(nullif(rl.opponent_deck, ''), 'Unknown deck') as opponent_deck,
  count(*) filter (where rl.result = 'win')::int as wins,
  count(*) filter (where rl.result = 'loss')::int as losses,
  count(*) filter (where rl.result = 'draw')::int as draws,
  count(*)::int as games,
  case
    when count(*) filter (where rl.result in ('win', 'loss')) > 0 then
      round(
        (count(*) filter (where rl.result = 'win'))::numeric
        / (count(*) filter (where rl.result in ('win', 'loss'))),
        4
      )
    else null
  end as win_rate,
  max(rl.created_at) as last_logged_at
from public.rank_logs rl
join public.profiles p on p.id = rl.user_id
where nullif(rl.player_deck, '') is not null
group by
  rl.user_id,
  p.handle,
  p.display_name,
  p.country_code,
  coalesce(nullif(rl.version_code, ''), 'all'),
  rl.queue_type,
  coalesce(nullif(rl.player_deck, ''), 'Unknown deck'),
  coalesce(nullif(rl.opponent_deck, ''), 'Unknown deck');

alter table public.profiles enable row level security;
alter table public.rank_logs enable row level security;
alter table public.trade_posts enable row level security;
alter table public.deck_discussions enable row level security;

create policy "profiles are public read"
on public.profiles for select
using (true);

create policy "users can upsert own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "rank logs are private to owner"
on public.rank_logs for select
using (auth.uid() = user_id);

create policy "users can insert own rank logs"
on public.rank_logs for insert
with check (auth.uid() = user_id);

create policy "users can update own rank logs"
on public.rank_logs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own rank logs"
on public.rank_logs for delete
using (auth.uid() = user_id);

create policy "trade posts are public read"
on public.trade_posts for select
using (true);

create policy "users can insert own trade posts"
on public.trade_posts for insert
with check (auth.uid() = user_id);

create policy "users can update own trade posts"
on public.trade_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "deck discussions are public read"
on public.deck_discussions for select
using (true);

create policy "users can insert own deck discussions"
on public.deck_discussions for insert
with check (auth.uid() = user_id);

create policy "users can update own deck discussions"
on public.deck_discussions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1), 'trainer-' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Trainer')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
