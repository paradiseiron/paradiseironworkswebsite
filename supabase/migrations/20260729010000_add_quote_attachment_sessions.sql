create table if not exists public.quote_attachment_sessions (
  project_id uuid primary key references public.projects(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.quote_attachment_sessions enable row level security;

alter table public.project_images
add column if not exists storage_bucket text not null default 'project-images';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'quote-attachments',
  'quote-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
