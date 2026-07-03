create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'estimator')),
  notification_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_roles (user_id, role, notification_email)
select id, 'admin', email
from auth.users
on conflict (user_id) do nothing;

alter table public.user_roles enable row level security;

alter table public.projects
  add column if not exists site_visit_status text not null default 'not_ready'
    check (site_visit_status in ('not_ready', 'ready', 'completed')),
  add column if not exists site_visit_ready_at timestamptz,
  add column if not exists site_visit_scheduled_date date,
  add column if not exists site_visit_window_start time,
  add column if not exists site_visit_window_end time,
  add column if not exists site_visit_location text,
  add column if not exists site_visit_admin_notes text,
  add column if not exists site_visit_assigned_to uuid references auth.users(id),
  add column if not exists site_visit_scope_observations text,
  add column if not exists site_visit_notes text,
  add column if not exists site_visit_exclusion_notes text,
  add column if not exists site_visit_access_safety_concerns text,
  add column if not exists site_visit_image_paths jsonb not null default '[]'::jsonb,
  add column if not exists site_visit_completed_at timestamptz;

insert into storage.buckets (id, name, public)
values ('site-visit-images', 'site-visit-images', false)
on conflict (id) do update set public = false;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "Estimator uploads site visit images" on storage.objects;
create policy "Estimator uploads site visit images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-visit-images'
  and public.current_user_role() = 'estimator'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Estimator reads own site visit images" on storage.objects;
create policy "Estimator reads own site visit images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'site-visit-images'
  and (
    public.current_user_role() = 'admin'
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
