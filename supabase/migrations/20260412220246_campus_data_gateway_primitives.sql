create schema if not exists private;

create table if not exists private.campus_data_request_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address inet,
  requested_at timestamptz not null default timezone('utc', now())
);

create index if not exists campus_data_request_log_user_requested_at_idx
  on private.campus_data_request_log (user_id, requested_at desc);

create index if not exists campus_data_request_log_ip_requested_at_idx
  on private.campus_data_request_log (ip_address, requested_at desc);

select cron.schedule(
  'bruingains-prune-campus-data-request-log',
  '15 8 * * *',
  $$delete from private.campus_data_request_log
    where requested_at < now() - interval '1 day';$$
);

select cron.schedule(
  'bruingains-prune-anonymous-auth-users',
  '20 8 * * *',
  $$delete from auth.users
    where is_anonymous is true
      and created_at < now() - interval '30 days';$$
);
