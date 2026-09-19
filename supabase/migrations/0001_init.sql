-- =====================================================================
-- Spiritual Journal & Devotion System — initial schema
-- Target: Supabase (Postgres 15+)
-- Run as: supabase/migrations/0001_init.sql
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type public.user_role   as enum ('admin', 'member');
create type public.entry_kind  as enum ('morning', 'evening');
create type public.visibility  as enum ('private', 'shared_with_admin');

-- ---------------------------------------------------------------------
-- 2. Groups (small groups / ministries / cohorts)
-- ---------------------------------------------------------------------
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text not null unique,
  display_name          text not null,
  role                  public.user_role not null default 'member',
  group_id              uuid references public.groups(id) on delete set null,
  timezone              text not null default 'Asia/Manila',
  is_active             boolean not null default true,
  must_change_password  boolean not null default true,
  last_seen_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index profiles_role_idx  on public.profiles(role);
create index profiles_group_idx on public.profiles(group_id);

-- Auto-create a profile whenever an auth user is created.
-- Username/display_name are passed through raw_user_meta_data at creation time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', 'New member'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'member'),
    coalesce(new.raw_user_meta_data->>'timezone', 'Asia/Manila')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. Entries — one table for both morning and evening
--    (views below preserve your DevotionLogs / EveningDiaries naming)
-- ---------------------------------------------------------------------
create table public.entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  entry_date        date not null,
  kind              public.entry_kind not null,

  -- morning (Quiet Time) fields
  scripture_ref     text,
  scripture_text    text,
  observation       text,
  application       text,
  prayer_points     text,

  -- evening (Spiritual Diary) fields
  presence_of_god   text,
  blessings         text,
  growth            text,
  struggles         text,

  -- shared
  mood              smallint check (mood between 1 and 5),
  visibility        public.visibility not null default 'private',
  is_prayer_request boolean not null default false,
  word_count        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (user_id, entry_date, kind)
);

create index entries_user_date_idx on public.entries(user_id, entry_date desc);
create index entries_shared_idx    on public.entries(visibility, entry_date desc)
  where visibility = 'shared_with_admin';
create index entries_prayer_idx    on public.entries(is_prayer_request, entry_date desc)
  where is_prayer_request;

-- Compatibility views. security_invoker makes RLS apply as the *querying* user.
create view public.devotion_logs with (security_invoker = true) as
  select * from public.entries where kind = 'morning';

create view public.evening_diaries with (security_invoker = true) as
  select * from public.entries where kind = 'evening';

-- ---------------------------------------------------------------------
-- 5. Schedule items (annual Bible reading / QT plan images)
-- ---------------------------------------------------------------------
create table public.schedule_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  image_path   text not null,               -- path inside the 'schedules' bucket
  starts_on    date not null,
  ends_on      date not null,
  version      integer not null default 1,
  is_published boolean not null default false,
  notes        text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index schedule_active_idx on public.schedule_items(is_published, starts_on, ends_on);

-- ---------------------------------------------------------------------
-- 6. Streak grace days (admin-granted, protects a streak)
-- ---------------------------------------------------------------------
create table public.streak_grace (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  grace_date  date not null,
  kind        public.entry_kind,            -- null = applies to both
  reason      text,
  granted_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (user_id, grace_date, kind)
);

-- ---------------------------------------------------------------------
-- 7. Announcements & reflection prompts
-- ---------------------------------------------------------------------
create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  body       text not null,
  starts_on  date not null default current_date,
  ends_on    date,
  is_active  boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.prompts (
  id        uuid primary key default gen_random_uuid(),
  kind      public.entry_kind not null,
  body      text not null,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- 8. System settings (single-row key/value)
-- ---------------------------------------------------------------------
create table public.system_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value) values
  ('app',      '{"church_name":"", "default_timezone":"Asia/Manila"}'),
  ('privacy',  '{"model":"opt_in_sharing"}'),
  ('streaks',  '{"counts":"separate", "grace_days_per_month":2}');

-- ---------------------------------------------------------------------
-- 9. Audit log
-- ---------------------------------------------------------------------
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,                -- 'user.create', 'entry.read', 'schedule.publish', ...
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index audit_actor_idx on public.audit_log(actor_id, created_at desc);

-- ---------------------------------------------------------------------
-- 10. Helper functions
-- ---------------------------------------------------------------------

-- security definer so it can read profiles without tripping profiles' own RLS
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.user_today(p_user uuid)
returns date
language sql stable security definer set search_path = public
as $$
  select ((now() at time zone coalesce(
            (select timezone from public.profiles where id = p_user),
            'Asia/Manila'))::date);
$$;

-- Current consecutive-day streak, walking backwards from today.
-- Today not yet logged does NOT break the streak (grace until midnight).
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

  if not exists (
    select 1 from public.entries
    where user_id = p_user and kind = p_kind and entry_date = v_today
  ) then
    v_cursor := v_today - 1;
  end if;

  loop
    exit when not (
      exists (
        select 1 from public.entries
        where user_id = p_user and kind = p_kind and entry_date = v_cursor
      )
      or exists (
        select 1 from public.streak_grace
        where user_id = p_user and grace_date = v_cursor
          and (kind = p_kind or kind is null)
      )
    );
    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
  end loop;

  return v_streak;
end;
$$;

-- Longest streak ever, via gaps-and-islands.
create or replace function public.longest_streak(p_user uuid, p_kind public.entry_kind)
returns integer
language sql stable security definer set search_path = public
as $$
  with days as (
    select entry_date as d from public.entries
      where user_id = p_user and kind = p_kind
    union
    select grace_date from public.streak_grace
      where user_id = p_user and (kind = p_kind or kind is null)
  ),
  islands as (
    select d, d - (row_number() over (order by d))::int as grp from days
  )
  select coalesce(max(cnt), 0) from (
    select count(*) as cnt from islands group by grp
  ) s;
$$;

-- One call for the dashboard card.
create or replace function public.my_streaks()
returns table (
  morning_current integer,
  morning_longest integer,
  evening_current integer,
  evening_longest integer,
  logged_today_morning boolean,
  logged_today_evening boolean,
  total_entries integer
)
language sql stable security definer set search_path = public
as $$
  select
    public.current_streak(auth.uid(), 'morning'),
    public.longest_streak(auth.uid(), 'morning'),
    public.current_streak(auth.uid(), 'evening'),
    public.longest_streak(auth.uid(), 'evening'),
    exists (select 1 from public.entries
            where user_id = auth.uid() and kind = 'morning'
              and entry_date = public.user_today(auth.uid())),
    exists (select 1 from public.entries
            where user_id = auth.uid() and kind = 'evening'
              and entry_date = public.user_today(auth.uid())),
    (select count(*)::int from public.entries where user_id = auth.uid());
$$;

-- Admin engagement view: metadata only, never entry bodies.
create or replace function public.admin_engagement(p_days integer default 30)
returns table (
  user_id        uuid,
  display_name   text,
  group_name     text,
  is_active      boolean,
  last_entry_on  date,
  days_since     integer,
  entries_in_window integer,
  morning_streak integer,
  evening_streak integer
)
language sql stable security definer set search_path = public
as $$
  select
    p.id,
    p.display_name,
    g.name,
    p.is_active,
    max(e.entry_date),
    (current_date - max(e.entry_date))::int,
    count(e.*) filter (where e.entry_date > current_date - p_days)::int,
    public.current_streak(p.id, 'morning'),
    public.current_streak(p.id, 'evening')
  from public.profiles p
  left join public.groups g on g.id = p.group_id
  left join public.entries e on e.user_id = p.id
  where public.is_admin() and p.role = 'member'
  group by p.id, p.display_name, g.name, p.is_active
  order by max(e.entry_date) nulls first;
$$;

-- updated_at + word_count maintenance
create or replace function public.touch_entry()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.word_count := coalesce(array_length(regexp_split_to_array(
    trim(coalesce(new.observation,'') || ' ' || coalesce(new.application,'') || ' ' ||
         coalesce(new.prayer_points,'') || ' ' || coalesce(new.presence_of_god,'') || ' ' ||
         coalesce(new.blessings,'') || ' ' || coalesce(new.growth,'') || ' ' ||
         coalesce(new.struggles,'')), '\s+'), 1), 0);
  return new;
end;
$$;

create trigger entries_touch
  before insert or update on public.entries
  for each row execute function public.touch_entry();

-- ---------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.entries        enable row level security;
alter table public.schedule_items enable row level security;
alter table public.streak_grace   enable row level security;
alter table public.announcements  enable row level security;
alter table public.prompts        enable row level security;
alter table public.groups         enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_log      enable row level security;

-- profiles ------------------------------------------------------------
create policy "read own profile"   on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "admin manages profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- entries -------------------------------------------------------------
-- THE core privacy rule: members own their entries outright.
-- The admin sees an entry only if the member shared it or flagged it for prayer.
create policy "members read own entries" on public.entries
  for select using (user_id = auth.uid());

create policy "admin reads shared entries" on public.entries
  for select using (
    public.is_admin() and (visibility = 'shared_with_admin' or is_prayer_request)
  );

create policy "members write own entries" on public.entries
  for insert with check (user_id = auth.uid());

create policy "members update own entries" on public.entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members delete own entries" on public.entries
  for delete using (user_id = auth.uid());
-- Note: there is deliberately NO admin insert/update/delete policy on entries.

-- schedule_items ------------------------------------------------------
create policy "everyone reads published schedule" on public.schedule_items
  for select using (is_published or public.is_admin());

create policy "admin manages schedule" on public.schedule_items
  for all using (public.is_admin()) with check (public.is_admin());

-- streak_grace --------------------------------------------------------
create policy "read own grace" on public.streak_grace
  for select using (user_id = auth.uid() or public.is_admin());

create policy "admin grants grace" on public.streak_grace
  for all using (public.is_admin()) with check (public.is_admin());

-- announcements / prompts / groups ------------------------------------
create policy "read active announcements" on public.announcements
  for select using (is_active or public.is_admin());
create policy "admin manages announcements" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read prompts" on public.prompts
  for select using (is_active or public.is_admin());
create policy "admin manages prompts" on public.prompts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read groups" on public.groups for select using (true);
create policy "admin manages groups" on public.groups
  for all using (public.is_admin()) with check (public.is_admin());

-- system_settings -----------------------------------------------------
create policy "read settings" on public.system_settings for select using (true);
create policy "admin writes settings" on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_log -----------------------------------------------------------
create policy "admin reads audit" on public.audit_log
  for select using (public.is_admin());
create policy "anyone appends audit" on public.audit_log
  for insert with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 12. Storage
-- ---------------------------------------------------------------------
-- The reading plan is not sensitive, so a public bucket keeps <img> simple.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('schedules', 'schedules', true, 10485760,
        array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;

-- Private bucket for anything that identifies a member.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "schedules readable by all"
  on storage.objects for select
  using (bucket_id = 'schedules');

create policy "schedules writable by admin"
  on storage.objects for insert
  with check (bucket_id = 'schedules' and public.is_admin());

create policy "schedules updatable by admin"
  on storage.objects for update
  using (bucket_id = 'schedules' and public.is_admin());

create policy "schedules deletable by admin"
  on storage.objects for delete
  using (bucket_id = 'schedules' and public.is_admin());

create policy "own avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars' and owner = auth.uid());

create policy "own avatar write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and owner = auth.uid());

-- ---------------------------------------------------------------------
-- 13. Seed prompts
-- ---------------------------------------------------------------------
insert into public.prompts (kind, body) values
  ('evening', 'Where did you notice God at work today?'),
  ('evening', 'What is one thing you are grateful for that you almost overlooked?'),
  ('evening', 'What did today teach you about your own heart?'),
  ('evening', 'Who did you serve today, and who served you?'),
  ('morning', 'What does this passage reveal about God''s character?'),
  ('morning', 'What is the one command, promise, or warning here you need most today?');
