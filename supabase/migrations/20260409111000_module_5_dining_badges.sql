alter table public.menu_items
  add column if not exists badge_labels jsonb not null default '[]'::jsonb;

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
  mi.item_order,
  mi.badge_labels
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
  mi.item_order,
  mi.badge_labels
from ranked_snapshots rs
join public.dining_halls dh on dh.id = rs.hall_id
join public.menu_items mi on mi.snapshot_id = rs.id
where rs.snapshot_rank = 1;
