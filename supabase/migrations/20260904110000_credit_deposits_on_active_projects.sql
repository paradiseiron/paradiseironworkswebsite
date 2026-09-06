-- Projects that do not request an initial-payment invoice are understood to
-- have collected the proposed deposit when the signed project became active.
update public.projects
set
  initial_payment_received_amount = proposal_deposit_amount,
  initial_payment_received_at = coalesce(started_at, updated_at, now())
where status = 'active'
  and proposal_initial_payment_required = false
  and proposal_deposit_amount is not null
  and proposal_deposit_amount > 0
  and initial_payment_received_at is null;

insert into public.project_activities (
  project_id,
  activity_type,
  activity_date,
  summary
)
select
  p.id,
  'payment_received',
  coalesce(p.started_at, p.updated_at, now()),
  'Proposal deposit of $' || to_char(p.proposal_deposit_amount, 'FM999,999,990.00') ||
    ' credited as received when the project became active.'
from public.projects p
where p.status = 'active'
  and p.proposal_initial_payment_required = false
  and p.proposal_deposit_amount is not null
  and p.proposal_deposit_amount > 0
  and p.initial_payment_received_amount = p.proposal_deposit_amount
  and not exists (
    select 1
    from public.project_activities activity
    where activity.project_id = p.id
      and activity.activity_type = 'payment_received'
  );

comment on column public.projects.proposal_initial_payment_required is
  'When true, the proposal deposit remains due when the project becomes active and is requested by the initial invoice. When false, activation credits the proposed deposit as received.';
