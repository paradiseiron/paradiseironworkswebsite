alter table public.cost_intake
  add column if not exists bid_opportunity_id uuid references public.bid_opportunities(id) on delete set null,
  add column if not exists is_general_expense boolean not null default false;

alter table public.project_costs
  alter column project_id drop not null,
  add column if not exists bid_opportunity_id uuid references public.bid_opportunities(id) on delete restrict,
  add column if not exists is_general_expense boolean not null default false;

alter table public.project_costs
  drop constraint if exists project_costs_assignment_check;

alter table public.project_costs
  add constraint project_costs_assignment_check check (
    (is_general_expense and project_id is null and bid_opportunity_id is null)
    or
    (not is_general_expense and ((project_id is not null)::integer + (bid_opportunity_id is not null)::integer = 1))
  );

create index if not exists cost_intake_bid_idx on public.cost_intake(bid_opportunity_id);
create index if not exists project_costs_bid_date_idx on public.project_costs(bid_opportunity_id, document_date desc);
