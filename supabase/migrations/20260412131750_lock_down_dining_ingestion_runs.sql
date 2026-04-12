do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'dining_ingestion_runs'
      and policyname = 'No public access to dining ingestion runs'
  ) then
    create policy "No public access to dining ingestion runs"
    on public.dining_ingestion_runs
    as restrictive
    for all
    to anon, authenticated
    using (false)
    with check (false);
  end if;
end;
$$;
