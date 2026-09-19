-- =====================================================================
-- Migration 0004 — per-member colour customisation
-- Run after 0003. Additive only.
-- =====================================================================

-- A member's overrides for the preset theme's colours:
--   {"bg":"#...","surface":"#...","ink":"#...","muted":"#...","line":"#..."}
-- Only the keys they changed are present. The accent colour keeps using the
-- existing profiles.accent_color column.
alter table public.profiles
  add column if not exists custom_colors jsonb not null default '{}'::jsonb;

-- The Appearance form also saves the language choice, and nothing in 0001/0002
-- created this column. `if not exists` makes this a no-op if you already added it.
alter table public.profiles
  add column if not exists locale text not null default 'en';

-- Only known keys, only #rrggbb values. This is what makes it safe to put these
-- values into inline CSS.
create or replace function public.valid_custom_colors(c jsonb)
returns boolean
language sql immutable
as $$
  select jsonb_typeof(c) = 'object'
     and (c - array['bg','surface','ink','muted','line']) = '{}'::jsonb
     and not exists (
       select 1 from jsonb_each(c) e
       where jsonb_typeof(e.value) <> 'string'
          or (e.value #>> '{}') !~* '^#[0-9a-f]{6}$'
     );
$$;

alter table public.profiles drop constraint if exists profiles_custom_colors_check;
alter table public.profiles
  add constraint profiles_custom_colors_check
  check (public.valid_custom_colors(custom_colors));

notify pgrst, 'reload schema';
