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
  opponent_deck text not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  queue_type text not null default 'Ranked',
  first_player boolean,
  notes text,
  rank_tier text,
  created_at timestamptz not null default now()
);

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
