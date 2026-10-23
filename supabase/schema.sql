-- Study Hopper public schema
-- Snapshot of https://ddenfnejlybzjvxuesbs.supabase.co (no row data).
-- Apply on a fresh database. The live project already has these objects.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.spots (
  id uuid default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  place_id text,
  avg_rating numeric(3, 2),
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  noise text,
  outlets text,
  wifi text,
  seating integer,
  price text,
  price_note text,
  hours text,
  open_late boolean,
  tags text[] not null default '{}',
  summary text,
  busiest_hours text,
  constraint spots_noise_check check (
    noise is null or noise = any (array['quiet', 'chatter', 'loud'])
  ),
  constraint spots_outlets_check check (
    outlets is null or outlets = any (array['every-table', 'few', 'none'])
  ),
  constraint spots_wifi_check check (
    wifi is null or wifi = any (array['slow', 'med', 'fast'])
  ),
  constraint spots_seating_check check (seating is null or seating > 0),
  constraint spots_price_check check (
    price is null or price = any (array['$', '$$', '$$$'])
  ),
  -- Kept the name from when this table was called cafes.
  constraint cafes_pkey primary key (id)
);

create unique index spots_place_id_key
  on public.spots (place_id)
  where place_id is not null and place_id <> '';

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score smallint not null,
  wifi smallint,
  outlets smallint,
  noise smallint,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_score_check check (score >= 1 and score <= 5),
  constraint ratings_wifi_check check (wifi is null or (wifi >= 1 and wifi <= 5)),
  constraint ratings_outlets_check check (outlets is null or (outlets >= 1 and outlets <= 5)),
  constraint ratings_noise_check check (noise is null or (noise >= 1 and noise <= 5)),
  constraint ratings_cafe_id_user_id_key unique (cafe_id, user_id)
);

create index ratings_cafe_id_idx on public.ratings (cafe_id);
create index ratings_user_id_idx on public.ratings (user_id);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete set null,
  started_at timestamptz not null default now(),
  duration_minutes integer not null,
  note text,
  created_at timestamptz not null default now(),
  place_name text,
  constraint study_sessions_duration_check check (
    duration_minutes > 0 and duration_minutes <= 1440
  )
);

create index study_sessions_started_at_idx on public.study_sessions (started_at desc);
create index study_sessions_user_id_idx on public.study_sessions (user_id);

create table public.kv_store_49042d98 (
  key text primary key,
  value jsonb not null
);

create index kv_store_49042d98_key_idx
  on public.kv_store_49042d98 (key text_pattern_ops);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.sync_cafe_rating_aggregates()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target_cafe_id uuid;
begin
  if tg_op = 'DELETE' then
    target_cafe_id := old.cafe_id;
  else
    target_cafe_id := new.cafe_id;
  end if;

  if tg_op = 'UPDATE' and old.cafe_id is distinct from new.cafe_id then
    update public.spots c
    set
      rating_count = coalesce(s.cnt, 0),
      avg_rating = s.avg_score,
      updated_at = now()
    from (
      select
        count(*)::integer as cnt,
        round(avg(score)::numeric, 2) as avg_score
      from public.ratings
      where cafe_id = old.cafe_id
    ) s
    where c.id = old.cafe_id;
  end if;

  update public.spots c
  set
    rating_count = coalesce(s.cnt, 0),
    avg_rating = s.avg_score,
    updated_at = now()
  from (
    select
      count(*)::integer as cnt,
      round(avg(score)::numeric, 2) as avg_score
    from public.ratings
    where cafe_id = target_cafe_id
  ) s
  where c.id = target_cafe_id;

  if not exists (select 1 from public.ratings where cafe_id = target_cafe_id) then
    update public.spots
    set rating_count = 0, avg_rating = null, updated_at = now()
    where id = target_cafe_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger ratings_sync_cafe_aggregates
after insert or update or delete on public.ratings
for each row
execute function public.sync_cafe_rating_aggregates();

create or replace function public.add_rating(
  target_cafe_id uuid,
  target_score smallint,
  target_wifi smallint default null,
  target_outlets smallint default null,
  target_noise smallint default null,
  target_note text default null
)
returns public.ratings
language plpgsql
set search_path to 'public'
as $$
declare
  inserted public.ratings;
begin
  if auth.uid() is null then
    raise exception 'Sign in before rating a spot';
  end if;

  insert into public.ratings (cafe_id, user_id, score, wifi, outlets, noise, note)
  values (
    target_cafe_id,
    auth.uid(),
    target_score,
    target_wifi,
    target_outlets,
    target_noise,
    target_note
  )
  returning * into inserted;

  return inserted;
end;
$$;

create or replace function public.add_ranked_cafe(
  cafe_name text,
  cafe_latitude double precision,
  cafe_longitude double precision,
  cafe_place_id text,
  target_score smallint,
  cafe_address text default null,
  target_wifi smallint default null,
  target_outlets smallint default null,
  target_noise smallint default null,
  target_note text default null,
  cafe_hours text default null,
  cafe_open_late boolean default null,
  cafe_seating integer default null,
  cafe_price text default null,
  cafe_price_note text default null,
  cafe_tags text[] default null
)
returns public.spots
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  spot public.spots;
  noise_label text;
  outlets_label text;
  wifi_label text;
  summary_text text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before adding a cafe';
  end if;

  if cafe_name is null or btrim(cafe_name) = '' then
    raise exception 'Cafe name is required';
  end if;

  if cafe_place_id is null or btrim(cafe_place_id) = '' then
    raise exception 'Google place_id is required';
  end if;

  if cafe_latitude is null or cafe_longitude is null
     or cafe_latitude < -90 or cafe_latitude > 90
     or cafe_longitude < -180 or cafe_longitude > 180 then
    raise exception 'A valid latitude and longitude are required';
  end if;

  if target_score is null or target_score < 1 or target_score > 5 then
    raise exception 'Score must be from 1 to 5';
  end if;

  if target_wifi is not null and (target_wifi < 1 or target_wifi > 5) then
    raise exception 'Wifi must be from 1 to 5';
  end if;
  if target_outlets is not null and (target_outlets < 1 or target_outlets > 5) then
    raise exception 'Outlets must be from 1 to 5';
  end if;
  if target_noise is not null and (target_noise < 1 or target_noise > 5) then
    raise exception 'Noise must be from 1 to 5';
  end if;
  if cafe_seating is not null and cafe_seating <= 0 then
    raise exception 'Seating must be greater than 0';
  end if;
  if cafe_price is not null and cafe_price not in ('$', '$$', '$$$') then
    raise exception 'Price must be $, $$, or $$$';
  end if;

  noise_label := case
    when target_noise is null then null
    when target_noise <= 2 then 'quiet'
    when target_noise = 3 then 'chatter'
    else 'loud'
  end;
  outlets_label := case
    when target_outlets is null then null
    when target_outlets <= 2 then 'none'
    when target_outlets = 3 then 'few'
    else 'every-table'
  end;
  wifi_label := case
    when target_wifi is null then null
    when target_wifi <= 2 then 'slow'
    when target_wifi = 3 then 'med'
    else 'fast'
  end;

  summary_text := concat_ws(', ',
    case noise_label
      when 'quiet' then 'quiet'
      when 'chatter' then 'a bit of chatter'
      when 'loud' then 'loud'
    end,
    case outlets_label
      when 'every-table' then 'outlets at every table'
      when 'few' then 'a few outlets'
      when 'none' then 'almost no outlets'
    end,
    case wifi_label
      when 'fast' then 'fast wifi'
      when 'med' then 'medium wifi'
      when 'slow' then 'slow wifi'
    end
  );
  if summary_text is null or summary_text = '' then
    summary_text := null;
  else
    summary_text := btrim(cafe_name) || ': ' || summary_text || '.';
  end if;

  select * into spot
  from public.spots
  where place_id = btrim(cafe_place_id);

  if spot.id is null then
    insert into public.spots (
      name, latitude, longitude, address, place_id,
      noise, outlets, wifi, seating, price, price_note, hours, open_late, tags, summary
    ) values (
      btrim(cafe_name),
      cafe_latitude,
      cafe_longitude,
      nullif(btrim(cafe_address), ''),
      btrim(cafe_place_id),
      noise_label,
      outlets_label,
      wifi_label,
      cafe_seating,
      cafe_price,
      nullif(btrim(cafe_price_note), ''),
      nullif(btrim(cafe_hours), ''),
      cafe_open_late,
      coalesce(cafe_tags, '{}'::text[]),
      summary_text
    )
    returning * into spot;
  end if;

  insert into public.ratings (cafe_id, user_id, score, wifi, outlets, noise, note)
  values (
    spot.id,
    auth.uid(),
    target_score,
    target_wifi,
    target_outlets,
    target_noise,
    nullif(btrim(target_note), '')
  );

  select * into spot from public.spots where id = spot.id;
  return spot;
end;
$$;

create or replace function public.log_study_session(
  hours numeric,
  spot_id uuid default null,
  started_at timestamptz default now(),
  note text default null,
  place_name text default null
)
returns public.study_sessions
language plpgsql
set search_path to 'public'
as $$
declare
  minutes integer;
  inserted public.study_sessions;
begin
  if auth.uid() is null then
    raise exception 'Sign in before logging a study session';
  end if;

  if hours is null or hours <= 0 or hours > 24 then
    raise exception 'Hours must be greater than 0 and no more than 24';
  end if;

  minutes := round(hours * 60)::integer;
  if minutes < 1 then
    minutes := 1;
  end if;

  insert into public.study_sessions (user_id, spot_id, started_at, duration_minutes, note, place_name)
  values (
    auth.uid(),
    spot_id,
    coalesce(started_at, now()),
    minutes,
    nullif(btrim(note), ''),
    nullif(btrim(place_name), '')
  )
  returning * into inserted;

  return inserted;
end;
$$;

create or replace function public.get_study_leaderboard(result_limit integer default 10)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  total_minutes integer,
  total_hours numeric,
  session_count integer
)
language sql
stable
security definer
set search_path to 'public', 'auth'
as $$
  select
    rank() over (order by sum(s.duration_minutes) desc, count(*) desc) as rank,
    s.user_id,
    coalesce(nullif(u.raw_user_meta_data->>'name', ''), 'Student') as display_name,
    sum(s.duration_minutes)::integer as total_minutes,
    round(sum(s.duration_minutes) / 60.0, 1) as total_hours,
    count(*)::integer as session_count
  from public.study_sessions s
  join auth.users u on u.id = s.user_id
  group by s.user_id, u.raw_user_meta_data
  order by total_minutes desc, session_count desc
  limit least(greatest(coalesce(result_limit, 10), 1), 50);
$$;

create or replace function public.get_recent_study_sessions(result_limit integer default 20)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  spot_name text,
  started_at timestamptz,
  duration_minutes integer,
  note text
)
language sql
stable
security definer
set search_path to 'public', 'auth'
as $$
  select
    s.id,
    s.user_id,
    coalesce(nullif(u.raw_user_meta_data->>'name', ''), 'Student') as display_name,
    coalesce(sp.name, nullif(s.place_name, ''), 'a study spot') as spot_name,
    s.started_at,
    s.duration_minutes,
    s.note
  from public.study_sessions s
  join auth.users u on u.id = s.user_id
  left join public.spots sp on sp.id = s.spot_id
  order by s.started_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- kv_store has RLS and no policies, so the Data API cannot read or write it.
-- ---------------------------------------------------------------------------

alter table public.spots enable row level security;
alter table public.ratings enable row level security;
alter table public.study_sessions enable row level security;
alter table public.kv_store_49042d98 enable row level security;

create policy cafes_select_authenticated
  on public.spots
  for select
  to authenticated
  using (true);

create policy ratings_select_authenticated
  on public.ratings
  for select
  to authenticated
  using (true);

create policy ratings_insert_own
  on public.ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy ratings_update_own
  on public.ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy ratings_delete_own
  on public.ratings
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy study_sessions_select_own
  on public.study_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy study_sessions_insert_own
  on public.study_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy study_sessions_update_own
  on public.study_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy study_sessions_delete_own
  on public.study_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (match the live project: table DML for API roles, execute limited)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete, truncate, references, trigger
  on table public.spots, public.ratings, public.study_sessions, public.kv_store_49042d98
  to anon, authenticated, service_role;

revoke all on function public.add_rating(uuid, smallint, smallint, smallint, smallint, text) from public;
revoke all on function public.add_ranked_cafe(text, double precision, double precision, text, smallint, text, smallint, smallint, smallint, text, text, boolean, integer, text, text, text[]) from public;
revoke all on function public.get_study_leaderboard(integer) from public;
revoke all on function public.log_study_session(numeric, uuid, timestamptz, text, text) from public;
revoke all on function public.get_recent_study_sessions(integer) from public;
revoke all on function public.sync_cafe_rating_aggregates() from public;

grant execute on function public.add_rating(uuid, smallint, smallint, smallint, smallint, text) to authenticated, service_role;
grant execute on function public.add_ranked_cafe(text, double precision, double precision, text, smallint, text, smallint, smallint, smallint, text, text, boolean, integer, text, text, text[]) to authenticated, service_role;
grant execute on function public.get_study_leaderboard(integer) to authenticated, service_role;
grant execute on function public.log_study_session(numeric, uuid, timestamptz, text, text) to anon, authenticated, service_role;
grant execute on function public.get_recent_study_sessions(integer) to anon, authenticated, service_role;
grant execute on function public.sync_cafe_rating_aggregates() to anon, authenticated, service_role;
