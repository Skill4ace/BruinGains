do $$
declare
  job_record record;
  secured_command text;
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'service_role_key'
  ) then
    raise exception using
      message = 'Missing vault secret: service_role_key',
      detail = 'Create the service_role_key secret in Supabase Vault before applying this migration.',
      hint = 'Store the project service role JWT in Vault, then re-run this migration.';
  end if;

  for job_record in
    select jobid, jobname, command
    from cron.job
    where jobname like 'bruingains-dining-ingest-%'
      or jobname = 'bruingains-campus-activity-sync'
  loop
    if position('Authorization' in job_record.command) > 0 then
      continue;
    end if;

    secured_command := replace(
      job_record.command,
      $$jsonb_build_object('Content-Type', 'application/json')$$,
      $$jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'service_role_key'
        )
      )$$
    );

    if secured_command = job_record.command then
      raise exception using
        message = format('Unable to secure cron job %s', job_record.jobname),
        detail = 'The job command did not match the expected header shape.',
        hint = 'Inspect cron.job.command for this job before re-running the migration.';
    end if;

    perform cron.alter_job(
      job_id := job_record.jobid,
      command := secured_command
    );
  end loop;
end;
$$;
