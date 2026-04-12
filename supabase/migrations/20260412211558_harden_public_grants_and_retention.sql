revoke insert, update, delete, truncate, references, trigger
on all tables in schema public
from anon, authenticated;

revoke all
on all sequences in schema public
from anon, authenticated;

revoke execute
on all functions in schema public
from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger
  on tables
  from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all
  on sequences
  from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute
  on functions
  from anon, authenticated;

select cron.schedule(
  'bruingains-prune-gym-capacity-snapshots',
  '5 8 * * *',
  $$delete from public.gym_capacity_snapshots
    where captured_at < now() - interval '30 days';$$
);

select cron.schedule(
  'bruingains-prune-dining-ingestion-runs',
  '10 8 * * *',
  $$delete from public.dining_ingestion_runs
    where requested_at < now() - interval '30 days';$$
);

drop function if exists private.configure_dining_ingestion_scheduler(text, text);
drop function if exists private.configure_dining_ingestion_scheduler(text, text, text);
