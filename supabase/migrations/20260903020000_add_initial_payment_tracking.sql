alter table public.projects
  add column if not exists proposal_initial_payment_required boolean not null default false,
  add column if not exists initial_payment_received_amount numeric(12,2),
  add column if not exists initial_payment_method text,
  add column if not exists initial_payment_received_at timestamptz,
  add column if not exists initial_payment_recorded_by uuid references auth.users(id);

alter table public.projects
  drop constraint if exists projects_initial_payment_received_amount_check;

alter table public.projects
  add constraint projects_initial_payment_received_amount_check
  check (initial_payment_received_amount is null or initial_payment_received_amount >= 0);

comment on column public.projects.proposal_initial_payment_required is
  'When true, the active-project invoice first requests the proposal deposit amount.';

comment on column public.projects.initial_payment_received_amount is
  'Actual first payment received; scheduled deposits are not treated as paid until this is recorded.';
