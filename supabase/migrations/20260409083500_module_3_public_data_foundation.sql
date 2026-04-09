create table public.dining_halls (
  id text primary key,
  name text not null unique,
  short_name text,
  sort_order integer not null default 100,
  is_main_hall boolean not null default false,
  fit_percent integer not null default 0 check (fit_percent between 0 and 100),
  breakfast_hours text,
  lunch_hours text,
  dinner_hours text,
  late_night_hours text,
  image_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.gym_locations (
  id text primary key,
  name text not null unique,
  hours text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.gym_capacity_snapshots (
  id bigint generated always as identity primary key,
  location_id text not null references public.gym_locations(id) on delete cascade,
  load numeric(4,3) not null check (load >= 0 and load <= 1),
  percent_full integer generated always as (round((load * 100)::numeric)) stored,
  captured_at timestamptz not null default timezone('utc', now()),
  source text,
  unique (location_id, captured_at)
);

create index gym_capacity_snapshots_location_captured_at_idx
  on public.gym_capacity_snapshots (location_id, captured_at desc);

create table public.menu_snapshots (
  id bigint generated always as identity primary key,
  hall_id text not null references public.dining_halls(id) on delete cascade,
  service_date date not null,
  meal_period text not null check (meal_period in ('breakfast', 'lunch', 'dinner', 'lateNight')),
  source_url text,
  fetched_at timestamptz not null default timezone('utc', now()),
  status text not null default 'ready' check (status in ('ready', 'stale', 'failed')),
  unique (hall_id, service_date, meal_period)
);

create index menu_snapshots_service_date_idx
  on public.menu_snapshots (service_date desc, meal_period);

create table public.menu_items (
  id bigint generated always as identity primary key,
  snapshot_id bigint not null references public.menu_snapshots(id) on delete cascade,
  station_name text,
  item_name text not null,
  serving_size text,
  calories integer check (calories is null or calories >= 0),
  protein_g integer check (protein_g is null or protein_g >= 0),
  carbs_g integer check (carbs_g is null or carbs_g >= 0),
  fats_g integer check (fats_g is null or fats_g >= 0),
  item_order integer not null default 0
);

create index menu_items_snapshot_item_order_idx
  on public.menu_items (snapshot_id, item_order, id);

alter table public.dining_halls enable row level security;
alter table public.gym_locations enable row level security;
alter table public.gym_capacity_snapshots enable row level security;
alter table public.menu_snapshots enable row level security;
alter table public.menu_items enable row level security;

grant select on public.dining_halls to anon, authenticated;
grant select on public.gym_locations to anon, authenticated;
grant select on public.gym_capacity_snapshots to anon, authenticated;
grant select on public.menu_snapshots to anon, authenticated;
grant select on public.menu_items to anon, authenticated;

create policy "Public read active dining halls"
  on public.dining_halls
  for select
  to anon, authenticated
  using (is_active);

create policy "Public read active gym locations"
  on public.gym_locations
  for select
  to anon, authenticated
  using (is_active);

create policy "Public read current gym snapshots"
  on public.gym_capacity_snapshots
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.gym_locations
      where gym_locations.id = gym_capacity_snapshots.location_id
        and gym_locations.is_active
    )
  );

create policy "Public read menu snapshots for active halls"
  on public.menu_snapshots
  for select
  to anon, authenticated
  using (
    status in ('ready', 'stale')
    and exists (
      select 1
      from public.dining_halls
      where dining_halls.id = menu_snapshots.hall_id
        and dining_halls.is_active
    )
  );

create policy "Public read menu items from visible snapshots"
  on public.menu_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.menu_snapshots
      join public.dining_halls on dining_halls.id = menu_snapshots.hall_id
      where menu_snapshots.id = menu_items.snapshot_id
        and menu_snapshots.status in ('ready', 'stale')
        and dining_halls.is_active
    )
  );

insert into public.dining_halls (
  id,
  name,
  short_name,
  sort_order,
  is_main_hall,
  fit_percent,
  breakfast_hours,
  lunch_hours,
  dinner_hours,
  late_night_hours,
  image_key
)
values
  ('bruin-plate', 'Bruin Plate', 'Bruin Plate', 1, true, 94, '7:00 AM - 9:00 AM', '11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM', null, 'bruin-plate'),
  ('de-neve', 'De Neve', 'De Neve', 2, true, 88, '7:00 AM - 10:00 AM', '11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM', '10:00 PM - 12:00 AM', 'de-neve'),
  ('epicuria-covel', 'Epicuria at Covel', 'Epicuria', 3, true, 92, null, '11:00 AM - 3:00 PM', '5:00 PM - 9:00 PM', null, 'epicuria-covel'),
  ('feast-rieber', 'Feast at Rieber', 'Feast', 4, false, 90, null, '11:00 AM - 2:00 PM', '5:00 PM - 9:00 PM', '9:00 PM - 11:00 PM', 'feast-rieber'),
  ('bruin-cafe', 'Bruin Cafe', 'Bruin Cafe', 5, false, 81, '7:00 AM - 10:00 AM', '11:00 AM - 4:00 PM', '5:00 PM - 9:00 PM', null, 'bruin-cafe'),
  ('cafe-1919', 'Cafe 1919', '1919', 6, false, 76, null, '11:00 AM - 4:00 PM', '5:00 PM - 9:00 PM', '9:00 PM - 10:00 PM', 'cafe-1919'),
  ('study-hedrick', 'The Study', 'The Study', 7, false, 84, '7:00 AM - 10:00 AM', '11:00 AM - 3:00 PM', '5:00 PM - 9:00 PM', '9:00 PM - 12:00 AM', 'study-hedrick'),
  ('the-drey', 'The Drey', 'The Drey', 8, false, 79, null, '11:00 AM - 3:00 PM', '5:00 PM - 9:00 PM', null, 'the-drey'),
  ('rendezvous', 'Rendezvous', 'Rende', 9, false, 86, null, '11:00 AM - 3:00 PM', '5:00 PM - 9:00 PM', null, 'rendezvous'),
  ('bruin-bowl', 'Bruin Bowl', 'Bruin Bowl', 10, false, 91, null, null, '5:00 PM - 9:00 PM', null, 'bruin-bowl'),
  ('epicuria-ackerman', 'Epicuria at Ackerman', 'Epic Ackerman', 11, false, 83, null, '11:00 AM - 4:00 PM', '5:00 PM - 9:00 PM', null, 'epicuria-ackerman');

insert into public.gym_locations (
  id,
  name,
  hours,
  sort_order
)
values
  ('wooden', 'Wooden Center', '6:00 AM - 11:00 PM', 1),
  ('bfit', 'BFit Gym', '6:00 AM - 10:00 PM', 2);

insert into public.gym_capacity_snapshots (
  location_id,
  load,
  captured_at,
  source
)
values
  ('wooden', 0.30, timezone('utc', now()), 'module-3-seed'),
  ('bfit', 0.75, timezone('utc', now()), 'module-3-seed');
