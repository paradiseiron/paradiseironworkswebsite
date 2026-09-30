create table if not exists public.bid_submittals (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunities(id) on delete cascade,
  submittal_number integer not null check (submittal_number > 0),
  revision_number integer not null default 0 check (revision_number >= 0),
  title text not null check (btrim(title) <> ''),
  submittal_type text not null default 'Shop Drawings',
  specification_section text,
  status text not null default 'draft' check (status in ('draft', 'preparing', 'submitted', 'approved', 'approved_as_noted', 'revise_and_resubmit', 'rejected', 'closed')),
  responsible_party text,
  submitted_to text,
  required_date date,
  submitted_date date,
  response_due_date date,
  response_date date,
  description text,
  reviewer_comments text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bid_opportunity_id, submittal_number)
);

create index if not exists bid_submittals_opportunity_idx on public.bid_submittals (bid_opportunity_id, submittal_number);
alter table public.bid_submittals enable row level security;

create policy "Assigned users read bid submittals" on public.bid_submittals for select to authenticated using (public.current_user_role() is not null);
create policy "Non-viewers create bid submittals" on public.bid_submittals for insert to authenticated with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Non-viewers update bid submittals" on public.bid_submittals for update to authenticated using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager')) with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Non-viewers delete bid submittals" on public.bid_submittals for delete to authenticated using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
