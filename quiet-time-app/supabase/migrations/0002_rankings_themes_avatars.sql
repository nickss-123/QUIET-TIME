-- =====================================================================
-- Spiritual Journal & Devotion System — migration 0002
-- Replaces grace days with rankings; adds profile themes and avatars.
-- Run after 0001_init.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Remove grace days
-- ---------------------------------------------------------------------
drop function if exists public.current_streak(uuid, public.entry_kind);
drop function if exists public.longest_streak(uuid, public.entry_kind);
drop table if exists public.streak_grace cascade;

-- A streak is now a plain run of consecutive logged days.
create or replace function public.current_streak(p_user uuid, p_kind public.entry_kind)
returns integer
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today  date := public.user_today(p_user);
  v_cursor date;
  v_streak integer := 0;
begin
  v_cursor := v_today;

  -- Today still open: not logging yet doesn't break the run.
  if not exists (
    select 1 from public.entries
    where user_id = p_user and kind = p_kind and entry_date = v_today
  ) then
    v_cursor := v_today - 1;
  end if;

  loop
    exit when not exists (
      select 1 from public.entries
      where user_id = p_user and kind = p_kind and entry_date = v_cursor
    );
    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
  end loop;

  return v_streak;
end;
$$;

create or replace function public.longest_streak(p_user uuid, p_kind public.entry_kind)
returns integer
language sql stable security definer set search_path = public
as $$
  with islands as (
    select entry_date,
           entry_date - (row_number() over (order by entry_date))::int as grp
    from public.entries
    where user_id = p_user and kind = p_kind
  )
  select coalesce(max(cnt), 0)
  from (select count(*) as cnt from islands group by grp) s;
$$;

-- ---------------------------------------------------------------------
-- 2. Profile appearance + ranking participation
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists theme               text    not null default 'dawn',
  add column if not exists accent_color        text,
  add column if not exists avatar_path         text,
  add column if not exists show_on_leaderboard boolean not null default true,
  add column if not exists bio                 text;

alter table public.profiles
  add constraint profiles_theme_check
  check (theme in ('dawn','vesper','cedar','linen','tide','ink'));

alter table public.profiles
  add constraint profiles_accent_check
  check (accent_color is null or accent_color ~* '^#[0-9a-f]{6}$');

-- Members may change their own appearance, but not their role or active flag.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and is_active = (select is_active from public.profiles where id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 3. Avatars become readable by everyone signed in
--    (they appear next to names on the leaderboard)
-- ---------------------------------------------------------------------
update storage.buckets set public = true where id = 'avatars';

drop policy if exists "own avatar read"  on storage.objects;
drop policy if exists "own avatar write" on storage.objects;

create policy "avatars readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "own avatar insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own avatar update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own avatar delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
-- Path convention: avatars/<user_id>/<timestamp>.webp
-- The foldername check is what stops one member overwriting another's photo.

-- ---------------------------------------------------------------------
-- 4. Rankings
-- ---------------------------------------------------------------------
-- Scope: 'all' or a group id. Period: 'week' | 'month' | 'year' | 'all'.
-- Ranked by entries logged in the period, tie-broken by current streak.
create or replace function public.leaderboard(
  p_period text default 'month',
  p_group  uuid default null,
  p_limit  integer default 50
)
returns table (
  rank            bigint,
  user_id         uuid,
  display_name    text,
  avatar_path     text,
  group_name      text,
  entries_count   integer,
  morning_streak  integer,
  evening_streak  integer,
  best_streak     integer,
  is_me           boolean
)
language sql stable security definer set search_path = public
as $$
  with bounds as (
    select case p_period
             when 'week'  then current_date - 6
             when 'month' then date_trunc('month', current_date)::date
             when 'year'  then date_trunc('year',  current_date)::date
             else '1900-01-01'::date
           end as from_date
  ),
  scored as (
    select
      p.id,
      p.display_name,
      p.avatar_path,
      g.name as group_name,
      count(e.*) filter (where e.entry_date >= (select from_date from bounds))::int as entries_count,
      public.current_streak(p.id, 'morning') as morning_streak,
      public.current_streak(p.id, 'evening') as evening_streak,
      greatest(
        public.longest_streak(p.id, 'morning'),
        public.longest_streak(p.id, 'evening')
      ) as best_streak
    from public.profiles p
    left join public.groups g on g.id = p.group_id
    left join public.entries e on e.user_id = p.id
    where p.is_active
      and p.role = 'member'
      and (p.show_on_leaderboard or p.id = auth.uid())
      and (p_group is null or p.group_id = p_group)
    group by p.id, p.display_name, p.avatar_path, g.name
  )
  select
    rank() over (
      order by entries_count desc,
               greatest(morning_streak, evening_streak) desc,
               display_name asc
    ),
    id, display_name, avatar_path, group_name,
    entries_count, morning_streak, evening_streak, best_streak,
    id = auth.uid()
  from scored
  where auth.uid() is not null
  order by 1
  limit p_limit;
$$;

-- Your own position, even when you fall outside the top N.
create or replace function public.my_rank(
  p_period text default 'month',
  p_group  uuid default null
)
returns table (rank bigint, entries_count integer, total_ranked bigint)
language sql stable security definer set search_path = public
as $$
  with board as (
    select * from public.leaderboard(p_period, p_group, 100000)
  )
  select b.rank, b.entries_count, (select count(*) from board)
  from board b
  where b.is_me;
$$;

-- ---------------------------------------------------------------------
-- 5. Settings
-- ---------------------------------------------------------------------
update public.system_settings
set value = '{"counts":"separate", "leaderboard":"enabled", "default_period":"month", "default_scope":"group"}'
where key = 'streaks';

insert into public.system_settings (key, value)
values ('appearance', '{"default_theme":"dawn", "allow_custom_accent": true}')
on conflict (key) do nothing;
