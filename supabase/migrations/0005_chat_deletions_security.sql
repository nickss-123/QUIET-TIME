-- 0005: group/general chat, entry deletion approvals, username changes.
-- Run this in the Supabase SQL editor after 0004.

-- ---------------------------------------------------------------------
-- 1. Chat messages (group chat + general chat). Questions keep using the
--    existing public.comments table so nothing already posted is lost.
-- ---------------------------------------------------------------------
do $$ begin
  create type public.chat_channel as enum ('group', 'general');
exception when duplicate_object then null; end $$;

create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  channel       public.chat_channel not null,
  group_id      uuid references public.groups(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  body          text,
  image_path    text,
  is_anonymous  boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint chat_messages_has_content check (
    coalesce(length(trim(body)), 0) > 0 or image_path is not null
  ),
  constraint chat_messages_group_needs_group check (
    (channel = 'group' and group_id is not null) or (channel = 'general' and group_id is null)
  )
);

create index if not exists chat_messages_channel_idx on public.chat_messages(channel, group_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "read general chat" on public.chat_messages;
create policy "read general chat" on public.chat_messages
  for select using (channel = 'general');

drop policy if exists "read own group chat" on public.chat_messages;
create policy "read own group chat" on public.chat_messages
  for select using (
    channel = 'group' and (
      public.is_admin() or
      group_id = (select group_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "post general chat" on public.chat_messages;
create policy "post general chat" on public.chat_messages
  for insert with check (user_id = auth.uid() and channel = 'general');

drop policy if exists "post own group chat" on public.chat_messages;
create policy "post own group chat" on public.chat_messages
  for insert with check (
    user_id = auth.uid() and channel = 'group' and (
      public.is_admin() or
      group_id = (select group_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "delete own chat" on public.chat_messages;
create policy "delete own chat" on public.chat_messages
  for delete using (user_id = auth.uid() or public.is_admin());

-- Members need to see each other's names/photos in chat.
drop policy if exists "read member directory" on public.profiles;
create policy "read member directory" on public.profiles
  for select using (auth.uid() is not null);

-- Chat images bucket (public read, members write into their own folder).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "chat images readable" on storage.objects;
create policy "chat images readable" on storage.objects
  for select using (bucket_id = 'chat-images');

drop policy if exists "chat images writable by owner" on storage.objects;
create policy "chat images writable by owner" on storage.objects
  for insert with check (
    bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 2. Entry deletion requests — members ask, admin approves.
-- ---------------------------------------------------------------------
do $$ begin
  create type public.deletion_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  entry_date   date not null,
  reason       text,
  status       public.deletion_status not null default 'pending',
  decided_by   uuid references public.profiles(id),
  decided_at   timestamptz,
  created_at   timestamptz not null default now()
);

create unique index if not exists deletion_requests_pending_unique
  on public.deletion_requests(user_id, entry_date) where status = 'pending';

alter table public.deletion_requests enable row level security;

drop policy if exists "read own deletion requests" on public.deletion_requests;
create policy "read own deletion requests" on public.deletion_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "create own deletion requests" on public.deletion_requests;
create policy "create own deletion requests" on public.deletion_requests
  for insert with check (user_id = auth.uid());

drop policy if exists "cancel own pending deletion requests" on public.deletion_requests;
create policy "cancel own pending deletion requests" on public.deletion_requests
  for delete using (user_id = auth.uid() and status = 'pending');

drop policy if exists "admin decides deletion requests" on public.deletion_requests;
create policy "admin decides deletion requests" on public.deletion_requests
  for update using (public.is_admin());

-- Approve: deletes both morning + evening for that date, then marks the request.
create or replace function public.approve_deletion(p_request uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.deletion_requests;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into r from public.deletion_requests where id = p_request and status = 'pending';
  if r.id is null then raise exception 'Request not found or already decided'; end if;

  delete from public.entries where user_id = r.user_id and entry_date = r.entry_date;

  update public.deletion_requests
  set status = 'approved', decided_by = auth.uid(), decided_at = now()
  where id = p_request;
end $$;

-- Members may no longer delete entries directly — only through an approved request.
drop policy if exists "members delete own entries" on public.entries;

-- ---------------------------------------------------------------------
-- 3. Username change: profiles.username is updated by the member; the
--    auth email (username@members.local) is updated server-side with the
--    service role key (see app/(app)/profile/security/actions.ts).
-- ---------------------------------------------------------------------
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;
