create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  slug text not null unique,
  name text not null,
  location text not null,
  work_type text not null check (work_type in ('Residential', 'Commercial', 'Structural')),
  product_types text[] not null default '{}',
  description text,
  summary text,
  year integer,
  image_paths text[] not null default '{}',
  image_alt text,
  specifications jsonb not null default '[]'::jsonb,
  seo_title text,
  meta_description text,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_projects_published_at_idx
  on public.portfolio_projects (published_at desc);

alter table public.portfolio_projects enable row level security;

drop policy if exists "Anyone reads published portfolio projects" on public.portfolio_projects;
create policy "Anyone reads published portfolio projects"
on public.portfolio_projects for select
to anon, authenticated
using (true);

drop policy if exists "Operational users publish portfolio projects" on public.portfolio_projects;
create policy "Operational users publish portfolio projects"
on public.portfolio_projects for all
to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman'))
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman'));

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Operational users upload portfolio images" on storage.objects;
create policy "Operational users upload portfolio images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio-images'
  and public.current_user_role() in ('admin', 'estimator', 'operations_foreman')
);

drop policy if exists "Operational users remove portfolio images" on storage.objects;
create policy "Operational users remove portfolio images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio-images'
  and public.current_user_role() in ('admin', 'estimator', 'operations_foreman')
);

alter table public.projects
  add column if not exists review_request_sent_at timestamptz;

