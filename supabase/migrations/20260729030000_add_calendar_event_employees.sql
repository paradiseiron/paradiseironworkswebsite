create table if not exists public.calendar_event_employees (
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  employee_id uuid not null references public.shop_employees(id),
  created_at timestamptz not null default now(),
  primary key (event_id, employee_id)
);

create index if not exists calendar_event_employees_employee_id_idx
on public.calendar_event_employees (employee_id);

alter table public.calendar_event_employees enable row level security;

drop policy if exists "Assigned users read calendar event employees"
on public.calendar_event_employees;
create policy "Assigned users read calendar event employees"
on public.calendar_event_employees for select
to authenticated
using (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman',
  'viewer'
));

drop policy if exists "Operational users create calendar event employees"
on public.calendar_event_employees;
create policy "Operational users create calendar event employees"
on public.calendar_event_employees for insert
to authenticated
with check (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman'
));

drop policy if exists "Operational users delete calendar event employees"
on public.calendar_event_employees;
create policy "Operational users delete calendar event employees"
on public.calendar_event_employees for delete
to authenticated
using (public.current_user_role() in (
  'admin',
  'estimator',
  'operations_foreman'
));
