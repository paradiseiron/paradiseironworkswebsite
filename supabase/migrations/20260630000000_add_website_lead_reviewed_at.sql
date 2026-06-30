alter table public.projects
add column if not exists website_lead_reviewed_at timestamptz;

comment on column public.projects.website_lead_reviewed_at is
  'When an authenticated admin first opened a lead submitted through the website.';

update public.projects
set website_lead_reviewed_at = coalesce(updated_at, now())
where lead_source = 'Website'
  and website_lead_reviewed_at is null;

create index if not exists projects_unreviewed_website_leads_idx
on public.projects (received_at desc)
where lead_source = 'Website'
  and website_lead_reviewed_at is null;
