create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  description text not null,
  responsibilities text[] not null default '{}',
  qualifications text[] not null default '{}',
  location text not null,
  employment_type text not null,
  compensation text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_postings_status_published_idx
  on public.job_postings (status, published_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references public.job_postings(id),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  state text,
  postal_code text,
  linkedin_url text,
  website_url text,
  work_authorized boolean not null,
  sponsorship_required boolean not null,
  age_confirmed boolean not null,
  start_date date,
  desired_compensation text,
  current_employer text,
  current_title text,
  years_experience integer,
  education text,
  skills text,
  referral_source text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'interview', 'offer', 'hired', 'declined')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_status_submitted_idx
  on public.job_applications (status, submitted_at desc);

create table if not exists public.job_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  document_type text not null check (document_type in ('resume', 'supporting')),
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_application_documents enable row level security;

drop policy if exists "Public reads published jobs" on public.job_postings;
create policy "Public reads published jobs" on public.job_postings for select
using (status = 'published');

drop policy if exists "Assigned users read job applications" on public.job_applications;
create policy "Assigned users read job applications" on public.job_applications for select to authenticated
using (public.current_user_role() <> 'unassigned');

drop policy if exists "Assigned users update job applications" on public.job_applications;
create policy "Assigned users update job applications" on public.job_applications for update to authenticated
using (public.current_user_role() <> 'unassigned')
with check (public.current_user_role() <> 'unassigned');

drop policy if exists "Assigned users read application documents" on public.job_application_documents;
create policy "Assigned users read application documents" on public.job_application_documents for select to authenticated
using (public.current_user_role() <> 'unassigned');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-application-documents',
  'job-application-documents',
  false,
  10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
