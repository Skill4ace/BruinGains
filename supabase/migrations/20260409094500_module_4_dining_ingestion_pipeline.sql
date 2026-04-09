create schema if not exists private;

alter table public.dining_halls
  add column if not exists source_path text;

update public.dining_halls
set source_path = case id
  when 'bruin-plate' then '/bruin-plate'
  when 'de-neve' then '/de-neve-dining'
  when 'epicuria-covel' then '/epicuria-at-covel'
  when 'feast-rieber' then '/spice-kitchen'
  when 'bruin-cafe' then '/bruin-cafe'
  when 'cafe-1919' then '/cafe-1919'
  when 'study-hedrick' then '/the-study-at-hedrick'
  when 'the-drey' then '/the-drey'
  when 'rendezvous' then '/rendezvous'
  when 'bruin-bowl' then '/bruin-bowl'
  when 'epicuria-ackerman' then '/epicuria-at-ackerman'
  else source_path
end
where source_path is null;

alter table public.menu_items
  add column if not exists recipe_id integer;

create index if not exists menu_items_snapshot_recipe_idx
  on public.menu_items (snapshot_id, recipe_id);

create table if not exists public.dining_ingestion_runs (
  id bigint generated always as identity primary key,
  target_date date not null,
  trigger_source text not null default 'manual',
  requested_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status text not null check (status in ('running', 'success', 'partial_failure', 'failure')),
  hall_count integer not null default 0,
  snapshot_count integer not null default 0,
  item_count integer not null default 0,
  error_count integer not null default 0,
  notes jsonb not null default '{}'::jsonb,
  error_message text
);

create index if not exists dining_ingestion_runs_target_date_idx
  on public.dining_ingestion_runs (target_date desc, started_at desc);

alter table public.dining_ingestion_runs enable row level security;

create or replace view public.menu_items_expanded as
select
  ms.id as snapshot_id,
  dh.id as hall_id,
  dh.name as hall_name,
  dh.sort_order as hall_sort_order,
  ms.service_date,
  ms.meal_period,
  ms.status as snapshot_status,
  ms.fetched_at,
  mi.recipe_id,
  mi.station_name,
  mi.item_name,
  mi.serving_size,
  mi.calories,
  mi.protein_g,
  mi.carbs_g,
  mi.fats_g,
  mi.item_order
from public.menu_snapshots ms
join public.dining_halls dh on dh.id = ms.hall_id
join public.menu_items mi on mi.snapshot_id = ms.id;

create or replace view public.latest_menu_items as
with ranked_snapshots as (
  select
    ms.*,
    row_number() over (
      partition by ms.hall_id, ms.meal_period
      order by ms.service_date desc, ms.fetched_at desc
    ) as snapshot_rank
  from public.menu_snapshots ms
  where ms.status in ('ready', 'stale')
)
select
  rs.id as snapshot_id,
  dh.id as hall_id,
  dh.name as hall_name,
  dh.sort_order as hall_sort_order,
  rs.service_date,
  rs.meal_period,
  rs.status as snapshot_status,
  rs.fetched_at,
  mi.recipe_id,
  mi.station_name,
  mi.item_name,
  mi.serving_size,
  mi.calories,
  mi.protein_g,
  mi.carbs_g,
  mi.fats_g,
  mi.item_order
from ranked_snapshots rs
join public.dining_halls dh on dh.id = rs.hall_id
join public.menu_items mi on mi.snapshot_id = rs.id
where rs.snapshot_rank = 1;

grant select on public.menu_items_expanded to anon, authenticated;
grant select on public.latest_menu_items to anon, authenticated;

create extension if not exists pg_net;
create extension if not exists pg_cron;
create or replace function private.configure_dining_ingestion_scheduler(
  project_url text,
  function_auth_jwt text,
  function_slug text default 'dining-ingest'
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  command_sql text;
  hall_record record;
  hall_job_name text;
  job_index integer := 0;
  minute_slot integer;
  period_key text;
  existing_job record;
begin
  for existing_job in
    select jobname
    from cron.job
    where jobname = 'bruingains-dining-menu-sync'
      or jobname like 'bruingains-dining-sync-%'
  loop
    perform cron.unschedule(existing_job.jobname);
  end loop;

  for hall_record in
    select
      id,
      breakfast_hours,
      lunch_hours,
      dinner_hours,
      late_night_hours
    from public.dining_halls
    where is_active
    order by sort_order asc
  loop
    foreach period_key in array array['breakfast', 'lunch', 'dinner', 'lateNight']
    loop
      if (
        (period_key = 'breakfast' and hall_record.breakfast_hours is null)
        or (period_key = 'lunch' and hall_record.lunch_hours is null)
        or (period_key = 'dinner' and hall_record.dinner_hours is null)
        or (period_key = 'lateNight' and hall_record.late_night_hours is null)
      ) then
        continue;
      end if;

      minute_slot := (job_index * 2 + 5) % 60;
      hall_job_name := format('bruingains-dining-sync-%s-%s', hall_record.id, lower(period_key));

      command_sql := format(
        $command$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := jsonb_build_object(
            'trigger', 'cron',
            'targetDate', to_char(((now() at time zone 'America/Los_Angeles'))::date, 'YYYY-MM-DD'),
            'hallIds', jsonb_build_array(%L),
            'mealPeriods', jsonb_build_array(%L)
          ),
          timeout_milliseconds := 300000
        );
        $command$,
        project_url || '/functions/v1/' || function_slug,
        function_auth_jwt,
        hall_record.id,
        period_key
      );

      perform cron.schedule(
        hall_job_name,
        format('%s */4 * * *', minute_slot),
        command_sql
      );

      job_index := job_index + 1;
    end loop;
  end loop;
end;
$$;
