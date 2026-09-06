alter table public.bid_opportunities
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
