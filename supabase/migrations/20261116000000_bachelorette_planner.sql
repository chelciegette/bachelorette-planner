-- Bachelorette Planner — database schema, access rules and public functions.
--
-- Run once: Supabase dashboard → SQL Editor → paste this whole file → Run.
-- (Or, with the Supabase CLI linked to your project: `supabase db push`.)
--
-- HOW ACCESS WORKS
--   • Bridesmaids (anonymous visitors) can NEVER read or write the table directly.
--     They only have two narrow functions: save_response() and get_my_response().
--     A bridesmaid proves "this response is mine" with her secret edit token, so
--     she can edit from any device but can never see anyone else's answers.
--   • The organizer signs in (Supabase Auth) and is listed in public.organizers.
--     Row Level Security lets only people in that table read or delete responses.
--   • Nothing here relies on user_metadata or on hiding UI — the database enforces it.

-- ─────────────────────────────────────────────────────────────────────────────
-- Private helpers (the `private` schema is not exposed through the Data API)
-- ─────────────────────────────────────────────────────────────────────────────
create schema if not exists private;

-- A friendly-looking but unguessable code, e.g. PEONY-7F3A9C21E4B0 (48 random bits
-- from gen_random_uuid(), which is cryptographically random).
create or replace function private.new_edit_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select (array['ROSE','PEONY','LILAC','PEARL','DAISY','BLUSH','SILK','DOVE','IVORY','LACE','PETAL','HONEY'])[1 + floor(random() * 12)::int]
         || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────
create table public.responses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  edit_token  text not null,
  -- Weekend ids, i.e. 'YYYY-MM-DD' of each weekend's first day, that she CANNOT attend.
  unavailable text[] not null default '{}' check (cardinality(unavailable) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Upper-case, punctuation-free copy of the token, so "peony 7f3a…" matches "PEONY-7F3A…".
  token_key   text generated always as (upper(regexp_replace(edit_token, '[^A-Za-z0-9]', '', 'g'))) stored
);

-- One response per name (case-insensitive), one row per token.
create unique index responses_name_unique on public.responses (lower(btrim(name)));
create unique index responses_token_unique on public.responses (token_key);

-- Who counts as an organizer: Supabase Auth users added here (see README → "Go live").
create table public.organizers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security: lock everything down, then open exactly what's needed
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.responses enable row level security;
alter table public.organizers enable row level security;

revoke all on public.responses from anon, authenticated;
revoke all on public.organizers from anon, authenticated;

-- Signed-in users may *attempt* to read/delete responses; the policies decide who succeeds.
grant select, delete on public.responses to authenticated;
grant select on public.organizers to authenticated;

-- An organizer can see their own row (this is what the policies below look up).
-- There is deliberately no insert/update/delete policy: nobody can promote themselves.
create policy "organizers can see their own row"
  on public.organizers for select to authenticated
  using (user_id = (select auth.uid()));

create policy "organizers can read all responses"
  on public.responses for select to authenticated
  using (exists (select 1 from public.organizers o where o.user_id = (select auth.uid())));

create policy "organizers can delete responses"
  on public.responses for delete to authenticated
  using (exists (select 1 from public.organizers o where o.user_id = (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- Public functions for bridesmaids (the ONLY way anonymous visitors touch the data)
--
-- These are SECURITY DEFINER on purpose: they run with the table owner's rights so
-- they can reach rows RLS hides from visitors. That makes them public endpoints, so
-- each one validates its input, pins search_path, and returns only what the caller
-- is entitled to — their own response, found via their secret token.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.response_json(r public.responses)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'edit_token', r.edit_token,
    'unavailable', to_jsonb(r.unavailable),
    'created_at', r.created_at,
    'updated_at', r.updated_at
  );
$$;

-- Load my own response from my edit token. Returns null when the token matches nothing.
create or replace function public.get_my_response(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.responses;
begin
  if p_token is null or length(p_token) > 100 then
    return null;
  end if;

  select * into r
  from public.responses
  where token_key = upper(regexp_replace(p_token, '[^A-Za-z0-9]', '', 'g'));

  if not found then
    return null;
  end if;
  return private.response_json(r);
end;
$$;

-- Create a response, or (when given a valid token) REPLACE that response's name and
-- availability. Never creates duplicates. Returns:
--   { ok: true,  created: bool, response: {...} }
--   { ok: false, error: 'NAME_REQUIRED' | 'NAME_TAKEN' | 'CODE_NOT_FOUND' | 'LIMIT_REACHED' }
create or replace function public.save_response(p_token text, p_name text, p_unavailable text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := btrim(left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40));
  v_dates text[];
  v_key   text;
  r       public.responses;
begin
  if v_name = '' then
    return jsonb_build_object('ok', false, 'error', 'NAME_REQUIRED');
  end if;

  -- Keep only well-formed weekend ids, de-duplicated and sorted.
  select coalesce(array_agg(distinct d order by d), '{}')
    into v_dates
  from (
    select d from unnest(coalesce(p_unavailable, '{}'::text[])) as d
    where d ~ '^\d{4}-\d{2}-\d{2}$'
    limit 120
  ) s;

  if p_token is not null and btrim(p_token) <> '' then
    v_key := upper(regexp_replace(p_token, '[^A-Za-z0-9]', '', 'g'));

    update public.responses
       set name = v_name, unavailable = v_dates, updated_at = now()
     where token_key = v_key
    returning * into r;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'CODE_NOT_FOUND');
    end if;
    return jsonb_build_object('ok', true, 'created', false, 'response', private.response_json(r));
  end if;

  -- A bridal party is a few dozen people at most; this stops a leaked link being used to flood the table.
  if (select count(*) from public.responses) >= 100 then
    return jsonb_build_object('ok', false, 'error', 'LIMIT_REACHED');
  end if;

  insert into public.responses (name, edit_token, unavailable)
  values (v_name, private.new_edit_token(), v_dates)
  returning * into r;

  return jsonb_build_object('ok', true, 'created', true, 'response', private.response_json(r));

exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'NAME_TAKEN');
end;
$$;

-- Postgres lets everyone execute new functions by default: close that, then open
-- exactly the two public ones. The private helpers stay callable only by the owner.
revoke all on function private.new_edit_token() from public;
revoke all on function private.response_json(public.responses) from public;
revoke all on function public.get_my_response(text) from public;
revoke all on function public.save_response(text, text, text[]) from public;

grant execute on function public.get_my_response(text) to anon, authenticated;
grant execute on function public.save_response(text, text, text[]) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Live dashboard updates (Supabase Realtime). Harmless if the publication is absent.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'responses'
     ) then
    alter publication supabase_realtime add table public.responses;
  end if;
end
$$;
