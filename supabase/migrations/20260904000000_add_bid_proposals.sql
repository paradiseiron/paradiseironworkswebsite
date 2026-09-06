alter table public.bid_opportunities
  add column if not exists proposal_number text,
  add column if not exists proposal_date date,
  add column if not exists proposal_recipient_company text,
  add column if not exists proposal_recipient_address text,
  add column if not exists proposal_attention text,
  add column if not exists proposal_intro text,
  add column if not exists proposal_scope_sections jsonb not null default '[]'::jsonb,
  add column if not exists proposal_pricing_mode text not null default 'lump_sum'
    check (proposal_pricing_mode in ('lump_sum', 'line_items')),
  add column if not exists proposal_lump_sum_amount numeric(14,2),
  add column if not exists proposal_pricing_items jsonb not null default '[]'::jsonb,
  add column if not exists proposal_clarifications text,
  add column if not exists proposal_exclusions text,
  add column if not exists proposal_addenda text,
  add column if not exists proposal_terms text,
  add column if not exists proposal_prepared_by text,
  add column if not exists proposal_prepared_by_title text,
  add column if not exists proposal_drafted_at timestamptz;

alter table public.bid_opportunities
  drop constraint if exists bid_opportunities_proposal_lump_sum_amount_check;

alter table public.bid_opportunities
  add constraint bid_opportunities_proposal_lump_sum_amount_check
  check (proposal_lump_sum_amount is null or proposal_lump_sum_amount >= 0);
