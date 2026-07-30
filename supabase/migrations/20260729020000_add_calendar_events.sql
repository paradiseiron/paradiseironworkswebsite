create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('fabrication', 'installation')),
  event_date date not null,
  window_start time,
  window_end time,
  project_id uuid references public.projects(id) on delete cascade,
  manual_project_name text,
  notes text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_project_check check (
    (project_id is not null and manual_project_name is null)
    or
    (
      project_id is null
      and nullif(btrim(manual_project_name), '') is not null
    )
  ),
  constraint calendar_events_time_window_check check (
    (window_start is null and window_end is null)
    or
    (
      window_start is not null
      and window_end is not null
      and window_end > window_start
    )
  )
);

create index if not exists calendar_events_event_date_idx
on public.calendar_events (event_date, window_start);

alter table public.calendar_events enable row level security;

drop policy if exists "Assigned users read calendar events"
on public.calendar_events;
create policy "Assigned users read calendar events"
on public.calendar_events for select
to authenticated
using (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman',
  'viewer'
));

drop policy if exists "Operational users create calendar events"
on public.calendar_events;
create policy "Operational users create calendar events"
on public.calendar_events for insert
to authenticated
with check (
  public.current_user_role() in (
    'admin',
    'estimator',
    'operations_foreman'
  )
  and created_by = auth.uid()
);

drop policy if exists "Operational users update calendar events"
on public.calendar_events;
create policy "Operational users update calendar events"
on public.calendar_events for update
to authenticated
using (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman'
))
with check (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman'
));

drop policy if exists "Operational users delete calendar events"
on public.calendar_events;
create policy "Operational users delete calendar events"
on public.calendar_events for delete
to authenticated
using (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman'
));
