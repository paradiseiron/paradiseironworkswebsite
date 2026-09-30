alter table public.email_campaigns
  add column if not exists headline text,
  add column if not exists layout text not null default 'centered',
  add column if not exists image_position text not null default 'above',
  add column if not exists accent_color text not null default '#fb5411',
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists images jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campaign-images', 'campaign-images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do nothing;
