update public.dining_ingestion_runs
set
  status = 'failure',
  completed_at = coalesce(completed_at, now()),
  error_message = coalesce(
    error_message,
    'Marked failed by migration after exceeding runtime without completion'
  )
where status = 'running'
  and completed_at is null
  and started_at < now() - interval '20 minutes';

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
begin
  raise exception using
    message = 'private.configure_dining_ingestion_scheduler is deprecated',
    detail = 'The live dining scheduler uses explicit daily jobs, including station-specific splits, and this helper no longer represents the deployed topology.',
    hint = 'Manage dining ingestion cron jobs through an explicit migration instead of calling this helper.';
end;
$$;
