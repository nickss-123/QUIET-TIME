-- =====================================================================
-- Migration 0003 — store every field the evening form collects
-- Run after 0002. Additive only: no existing rows or columns are touched.
-- =====================================================================
--
-- Why: the evening form (app/(app)/evening/actions.ts) writes ten columns
-- that 0001 never created. Every evening save was rejected by Postgres, so
-- nothing typed into the evening form was being kept.

-- ---------------------------------------------------------------------
-- 1. Evening columns
-- ---------------------------------------------------------------------
alter table public.entries
  add column if not exists holy_spirit_conscious       text,  -- choice
  add column if not exists coram_deo                   text,  -- choice
  add column if not exists one_minute_prayer           text,  -- choice
  add column if not exists supernatural_joy_peace      text,  -- choice
  add column if not exists holy_spirit_guidance_crisis text,
  add column if not exists love_endure_forgive         text,
  add column if not exists grace_received              text,
  add column if not exists thankful_for                text,
  add column if not exists repent_of                   text,
  add column if not exists prayer_requests             text;

-- The old evening columns (presence_of_god, blessings, growth, struggles)
-- stay in place; anything already written there is still readable in the app.

-- ---------------------------------------------------------------------
-- 2. word_count now covers the new free-text fields
--    (choice fields are excluded; an empty entry counts 0, not 1)
-- ---------------------------------------------------------------------
create or replace function public.touch_entry()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.word_count := coalesce(array_length(regexp_split_to_array(
    nullif(trim(
      coalesce(new.observation,'')                  || ' ' ||
      coalesce(new.application,'')                  || ' ' ||
      coalesce(new.prayer_points,'')                || ' ' ||
      coalesce(new.presence_of_god,'')              || ' ' ||
      coalesce(new.blessings,'')                    || ' ' ||
      coalesce(new.growth,'')                       || ' ' ||
      coalesce(new.struggles,'')                    || ' ' ||
      coalesce(new.holy_spirit_guidance_crisis,'')  || ' ' ||
      coalesce(new.love_endure_forgive,'')          || ' ' ||
      coalesce(new.grace_received,'')               || ' ' ||
      coalesce(new.thankful_for,'')                 || ' ' ||
      coalesce(new.repent_of,'')                    || ' ' ||
      coalesce(new.prayer_requests,'')
    ), ''), '\s+'), 1), 0);
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Refresh the compatibility views so they include the new columns
--    (a view built from `select *` keeps the column list it had at creation)
-- ---------------------------------------------------------------------
create or replace view public.devotion_logs with (security_invoker = true) as
  select * from public.entries where kind = 'morning';

create or replace view public.evening_diaries with (security_invoker = true) as
  select * from public.entries where kind = 'evening';

-- Make PostgREST (the Supabase API) pick up the new columns immediately.
notify pgrst, 'reload schema';
