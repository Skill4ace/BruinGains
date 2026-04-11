alter table public.gym_capacity_snapshots
  add column if not exists zone_breakdown jsonb;
