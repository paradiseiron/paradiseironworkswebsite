alter table public.projects
  add column if not exists proposal_customer_responsibilities text,
  add column if not exists proposal_terms_and_conditions text;

comment on column public.projects.proposal_customer_responsibilities is
  'Customer responsibilities included in the proposal.';

comment on column public.projects.proposal_terms_and_conditions is
  'Terms and conditions included in the proposal.';
