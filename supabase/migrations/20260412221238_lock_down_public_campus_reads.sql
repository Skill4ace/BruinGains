revoke select on table public.dining_halls from anon, authenticated;
revoke select on table public.gym_locations from anon, authenticated;
revoke select on table public.gym_capacity_snapshots from anon, authenticated;
revoke select on table public.menu_snapshots from anon, authenticated;
revoke select on table public.menu_items from anon, authenticated;

revoke select on table public.latest_menu_items from anon, authenticated;
revoke select on table public.menu_items_expanded from anon, authenticated;
