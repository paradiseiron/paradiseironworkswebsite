create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  content_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_id_created_at_idx
  on public.project_images (project_id, created_at desc);

alter table public.project_images enable row level security;

drop policy if exists "Operational users read project images" on public.project_images;
create policy "Operational users read project images"
on public.project_images for select
to authenticated
using (public.current_user_role() in ('admin', 'estimator'));

drop policy if exists "Operational users insert project images" on public.project_images;
create policy "Operational users insert project images"
on public.project_images for insert
to authenticated
with check (public.current_user_role() in ('admin', 'estimator'));

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Operational users upload project images" on storage.objects;
create policy "Operational users upload project images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and public.current_user_role() in ('admin', 'estimator')
);

drop policy if exists "Operational users read project images" on storage.objects;
create policy "Operational users read project images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'project-images'
  and public.current_user_role() in ('admin', 'estimator')
);
