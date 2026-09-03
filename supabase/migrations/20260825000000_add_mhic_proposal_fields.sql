alter table public.projects
  add column if not exists proposal_mhic_enabled boolean not null default false,
  add column if not exists proposal_mhic_contract_date date,
  add column if not exists proposal_mhic_start_date date,
  add column if not exists proposal_mhic_completion_date date,
  add column if not exists proposal_mhic_salesperson_name text,
  add column if not exists proposal_mhic_salesperson_license_number text,
  add column if not exists proposal_mhic_payment_schedule text,
  add column if not exists proposal_mhic_finance_charge text,
  add column if not exists proposal_mhic_collateral_security text,
  add column if not exists proposal_mhic_incorporated_documents text,
  add column if not exists proposal_mhic_door_to_door_status text,
  add column if not exists proposal_mhic_buyer_age_65_plus boolean not null default false,
  add column if not exists proposal_mhic_cancellation_deadline date,
  add column if not exists proposal_mhic_secured_by_property boolean not null default false,
  add column if not exists proposal_mhic_warranty_claim_procedure text;

comment on column public.projects.proposal_mhic_enabled is
  'When true, render the residential proposal as a Maryland home improvement contract.';
