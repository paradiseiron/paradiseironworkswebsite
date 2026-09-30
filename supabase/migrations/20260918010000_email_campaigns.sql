create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  postal_address text,
  audience_type text,
  status text not null default 'draft' check (status in ('draft', 'sending', 'completed')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  launched_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  email text not null,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  resend_id text,
  error text,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_checked_at timestamptz,
  unique (campaign_id, email)
);
create index if not exists email_campaign_recipients_campaign_status_idx on public.email_campaign_recipients(campaign_id, status);

create table if not exists public.email_suppressions (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;
alter table public.email_suppressions enable row level security;
