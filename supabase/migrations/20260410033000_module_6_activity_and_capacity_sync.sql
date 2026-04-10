alter table public.dining_halls
  alter column fit_percent drop not null,
  alter column fit_percent drop default;

alter table public.gym_capacity_snapshots
  add column if not exists zone_name text,
  add column if not exists is_closed boolean not null default false;

update public.gym_capacity_snapshots
set zone_name = case location_id
  when 'wooden' then 'Pardee Gym'
  when 'bfit' then 'Free Weight & Squat Zones'
  else zone_name
end
where zone_name is null;
