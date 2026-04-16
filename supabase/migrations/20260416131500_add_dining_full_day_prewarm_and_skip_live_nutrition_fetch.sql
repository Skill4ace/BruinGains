do $$
declare
  job_record record;
  updated_command text;
  prewarm_command text;
begin
  for job_record in
    select jobid, jobname, command
    from cron.job
    where jobname like 'bruingains-dining-ingest-%'
  loop
    if position('''skipNutritionFetch'', true' in job_record.command) > 0 then
      continue;
    end if;

    updated_command := replace(
      job_record.command,
      $target$'targetDate', to_char(((now() at time zone 'America/Los_Angeles'))::date, 'YYYY-MM-DD'),$target$,
      $replacement$'targetDate', to_char(((now() at time zone 'America/Los_Angeles'))::date, 'YYYY-MM-DD'),
      'skipNutritionFetch', true,$replacement$
    );

    if updated_command = job_record.command then
      raise exception using
        message = format('Unable to inject skipNutritionFetch for cron job %s', job_record.jobname),
        detail = 'The job command did not match the expected body payload shape.',
        hint = 'Inspect cron.job.command and update this migration if the command template changed.';
    end if;

    perform cron.alter_job(
      job_id := job_record.jobid,
      command := updated_command
    );
  end loop;

  if exists (
    select 1
    from cron.job
    where jobname = 'bruingains-dining-ingest-all-day-prewarm'
  ) then
    perform cron.unschedule('bruingains-dining-ingest-all-day-prewarm');
  end if;

  prewarm_command := $command$
    select net.http_post(
      url := 'https://afxptjzzctiowrqqcyzh.supabase.co/functions/v1/dining-ingest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'service_role_key'
        )
      ),
      body := jsonb_build_object(
        'trigger', 'cron',
        'targetDate', to_char(((now() at time zone 'America/Los_Angeles'))::date, 'YYYY-MM-DD'),
        'skipNutritionFetch', true
      ),
      timeout_milliseconds := 300000
    );
  $command$;

  perform cron.schedule(
    'bruingains-dining-ingest-all-day-prewarm',
    '0 14 * * *',
    prewarm_command
  );
end;
$$;
