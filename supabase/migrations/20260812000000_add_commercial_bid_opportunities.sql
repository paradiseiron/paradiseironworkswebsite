alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check
  check (
    role in (
      'admin',
      'estimator',
      'operations_foreman',
      'bid_estimator',
      'project_manager',
      'viewer'
    )
  );

create table if not exists public.bid_opportunities (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  general_contractor text,
  owner_name text,
  architect_name text,
  project_address text,
  city text,
  state text,
  zip_code text,
  bid_due_date date not null,
  bid_due_time time,
  status text not null default 'opportunity'
    check (status in ('opportunity', 'reviewing', 'estimating', 'submitted', 'won', 'lost', 'cancelled')),
  assigned_estimator_id uuid references auth.users(id) on delete set null,
  estimated_contract_value numeric(14,2),
  probability integer check (probability between 0 and 100),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  scope_summary text,
  exclusion_notes text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  outcome_at timestamptz,
  converted_project_id uuid references public.projects(id) on delete set null
);

create index if not exists bid_opportunities_due_date_idx
  on public.bid_opportunities (bid_due_date);

create index if not exists bid_opportunities_status_idx
  on public.bid_opportunities (status);

create index if not exists bid_opportunities_estimator_idx
  on public.bid_opportunities (assigned_estimator_id);

alter table public.bid_opportunities enable row level security;

drop policy if exists "Assigned users read bid opportunities" on public.bid_opportunities;
create policy "Assigned users read bid opportunities"
on public.bid_opportunities for select
to authenticated
using (
  public.current_user_role() in (
    'admin',
    'estimator',
    'operations_foreman',
    'bid_estimator',
    'project_manager',
    'viewer'
  )
);

drop policy if exists "Bid team creates opportunities" on public.bid_opportunities;
create policy "Bid team creates opportunities"
on public.bid_opportunities for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'bid_estimator', 'project_manager')
  and created_by = auth.uid()
);

drop policy if exists "Bid team updates opportunities" on public.bid_opportunities;
create policy "Bid team updates opportunities"
on public.bid_opportunities for update
to authenticated
using (public.current_user_role() in ('admin', 'bid_estimator', 'project_manager'))
with check (public.current_user_role() in ('admin', 'bid_estimator', 'project_manager'));

drop policy if exists "Admin deletes bid opportunities" on public.bid_opportunities;
create policy "Admin deletes bid opportunities"
on public.bid_opportunities for delete
to authenticated
using (public.current_user_role() = 'admin');
