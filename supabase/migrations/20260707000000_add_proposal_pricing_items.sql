alter table public.projects
  add column if not exists proposal_pricing_items jsonb not null default '[]'::jsonb;
