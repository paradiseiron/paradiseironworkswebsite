create table if not exists public.shop_employees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shop_employees (name, sort_order)
values
  ('Giovanni', 10),
  ('William', 20),
  ('Mohammad', 30)
on conflict (name) do update
set active = true,
    sort_order = excluded.sort_order,
    updated_at = now();

create table if not exists public.daily_shop_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'submitted')),
  general_shop_notes text,
  progress_blockers text,
  created_by uuid not null references auth.users(id),
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'draft' and submitted_by is null and submitted_at is null)
    or
    (status = 'submitted' and submitted_by is not null and submitted_at is not null)
  )
);

create index if not exists daily_shop_reports_status_date_idx
  on public.daily_shop_reports (status, report_date desc);

create table if not exists public.daily_shop_report_employees (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_shop_reports(id) on delete cascade,
  employee_id uuid not null references public.shop_employees(id),
  sort_order integer not null default 0,
  total_minutes integer not null default 0 check (total_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, employee_id)
);

create index if not exists daily_shop_report_employees_report_idx
  on public.daily_shop_report_employees (report_id, sort_order);

create table if not exists public.daily_shop_report_entries (
  id uuid primary key default gen_random_uuid(),
  report_employee_id uuid not null
    references public.daily_shop_report_employees(id) on delete cascade,
  project_id uuid references public.projects(id),
  manual_project_name text,
  time_in time not null,
  time_out time not null,
  minutes_worked integer not null check (minutes_worked > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (time_out > time_in),
  check (
    (project_id is not null)
    <>
    (nullif(btrim(manual_project_name), '') is not null)
  )
);

create index if not exists daily_shop_report_entries_employee_idx
  on public.daily_shop_report_entries (report_employee_id, sort_order);

create table if not exists public.daily_shop_report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_shop_reports(id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  content_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists daily_shop_report_images_report_idx
  on public.daily_shop_report_images (report_id, created_at);

alter table public.shop_employees enable row level security;
alter table public.daily_shop_reports enable row level security;
alter table public.daily_shop_report_employees enable row level security;
alter table public.daily_shop_report_entries enable row level security;
alter table public.daily_shop_report_images enable row level security;

drop policy if exists "Assigned users read shop employees" on public.shop_employees;
create policy "Assigned users read shop employees"
on public.shop_employees for select
to authenticated
using (
  public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
);

drop policy if exists "Users read available shop reports" on public.daily_shop_reports;
create policy "Users read available shop reports"
on public.daily_shop_reports for select
to authenticated
using (
  (
    status = 'submitted'
    and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
  )
  or
  (
    status = 'draft'
    and public.current_user_role() = 'operations_foreman'
    and created_by = auth.uid()
  )
);

drop policy if exists "Foreman creates shop report drafts" on public.daily_shop_reports;
create policy "Foreman creates shop report drafts"
on public.daily_shop_reports for insert
to authenticated
with check (
  public.current_user_role() = 'operations_foreman'
  and created_by = auth.uid()
  and status = 'draft'
  and submitted_by is null
  and submitted_at is null
);

drop policy if exists "Foreman updates own shop report drafts" on public.daily_shop_reports;
create policy "Foreman updates own shop report drafts"
on public.daily_shop_reports for update
to authenticated
using (
  public.current_user_role() = 'operations_foreman'
  and created_by = auth.uid()
  and status = 'draft'
)
with check (
  public.current_user_role() = 'operations_foreman'
  and created_by = auth.uid()
  and (
    (status = 'draft' and submitted_by is null and submitted_at is null)
    or
    (status = 'submitted' and submitted_by = auth.uid() and submitted_at is not null)
  )
);

drop policy if exists "Foreman deletes own shop report drafts" on public.daily_shop_reports;
create policy "Foreman deletes own shop report drafts"
on public.daily_shop_reports for delete
to authenticated
using (
  public.current_user_role() = 'operations_foreman'
  and created_by = auth.uid()
  and status = 'draft'
);

drop policy if exists "Users read available report employees" on public.daily_shop_report_employees;
create policy "Users read available report employees"
on public.daily_shop_report_employees for select
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and (
        (
          report.status = 'submitted'
          and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
        )
        or
        (
          report.status = 'draft'
          and public.current_user_role() = 'operations_foreman'
          and report.created_by = auth.uid()
        )
      )
  )
);

drop policy if exists "Foreman manages draft report employees" on public.daily_shop_report_employees;
create policy "Foreman manages draft report employees"
on public.daily_shop_report_employees for all
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
)
with check (
  exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
);

drop policy if exists "Users read available report entries" on public.daily_shop_report_entries;
create policy "Users read available report entries"
on public.daily_shop_report_entries for select
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_report_employees report_employee
    join public.daily_shop_reports report on report.id = report_employee.report_id
    where report_employee.id = report_employee_id
      and (
        (
          report.status = 'submitted'
          and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
        )
        or
        (
          report.status = 'draft'
          and public.current_user_role() = 'operations_foreman'
          and report.created_by = auth.uid()
        )
      )
  )
);

drop policy if exists "Foreman manages draft report entries" on public.daily_shop_report_entries;
create policy "Foreman manages draft report entries"
on public.daily_shop_report_entries for all
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_report_employees report_employee
    join public.daily_shop_reports report on report.id = report_employee.report_id
    where report_employee.id = report_employee_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
)
with check (
  exists (
    select 1
    from public.daily_shop_report_employees report_employee
    join public.daily_shop_reports report on report.id = report_employee.report_id
    where report_employee.id = report_employee_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
);

drop policy if exists "Users read available report images" on public.daily_shop_report_images;
create policy "Users read available report images"
on public.daily_shop_report_images for select
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and (
        (
          report.status = 'submitted'
          and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
        )
        or
        (
          report.status = 'draft'
          and public.current_user_role() = 'operations_foreman'
          and report.created_by = auth.uid()
        )
      )
  )
);

drop policy if exists "Foreman manages draft report images" on public.daily_shop_report_images;
create policy "Foreman manages draft report images"
on public.daily_shop_report_images for all
to authenticated
using (
  exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
)
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.daily_shop_reports report
    where report.id = report_id
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
);

insert into storage.buckets (id, name, public)
values ('daily-shop-report-images', 'daily-shop-report-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Users read available daily shop report files" on storage.objects;
create policy "Users read available daily shop report files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'daily-shop-report-images'
  and exists (
    select 1
    from public.daily_shop_reports report
    where report.id::text = (storage.foldername(name))[1]
      and (
        (
          report.status = 'submitted'
          and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
        )
        or
        (
          report.status = 'draft'
          and public.current_user_role() = 'operations_foreman'
          and report.created_by = auth.uid()
        )
      )
  )
);

drop policy if exists "Foreman uploads daily shop report files" on storage.objects;
create policy "Foreman uploads daily shop report files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'daily-shop-report-images'
  and exists (
    select 1
    from public.daily_shop_reports report
    where report.id::text = (storage.foldername(name))[1]
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
);

drop policy if exists "Foreman deletes daily shop report files" on storage.objects;
create policy "Foreman deletes daily shop report files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'daily-shop-report-images'
  and exists (
    select 1
    from public.daily_shop_reports report
    where report.id::text = (storage.foldername(name))[1]
      and report.status = 'draft'
      and report.created_by = auth.uid()
      and public.current_user_role() = 'operations_foreman'
  )
);
