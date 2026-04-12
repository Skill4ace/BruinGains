alter view public.latest_menu_items
  set (security_invoker = on);

alter view public.menu_items_expanded
  set (security_invoker = on);
