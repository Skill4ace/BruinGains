create table if not exists public.campus_data_request_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address inet,
  requested_at timestamptz not null default timezone('utc', now())
);

alter table public.campus_data_request_log enable row level security;

revoke all on table public.campus_data_request_log from anon, authenticated;

create policy "No public access to campus data request log"
on public.campus_data_request_log
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists campus_data_request_log_user_requested_at_idx
  on public.campus_data_request_log (user_id, requested_at desc);

create index if not exists campus_data_request_log_ip_requested_at_idx
  on public.campus_data_request_log (ip_address, requested_at desc);

select cron.schedule(
  'bruingains-prune-campus-data-request-log',
  '15 8 * * *',
  $$delete from public.campus_data_request_log
    where requested_at < now() - interval '1 day';$$
);
