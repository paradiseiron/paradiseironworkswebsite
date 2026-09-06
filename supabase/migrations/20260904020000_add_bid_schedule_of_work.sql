create table if not exists public.bid_work_items (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunities(id) on delete cascade,
  item_number text,
  description text not null,
  scheduled_value numeric(14, 2) check (scheduled_value is null or scheduled_value >= 0),
  fabrication_complete boolean not null default false,
  fabrication_completed_at timestamptz,
  delivery_complete boolean not null default false,
  delivery_completed_at timestamptz,
  installation_complete boolean not null default false,
  installation_completed_at timestamptz,
  ready_for_billing boolean not null default false,
  ready_for_billing_at timestamptz,
  paid boolean not null default false,
  paid_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bid_work_items_opportunity_idx
  on public.bid_work_items (bid_opportunity_id, sort_order, created_at);

alter table public.bid_work_items enable row level security;

create policy "Assigned users read bid work items"
on public.bid_work_items for select to authenticated
using (public.current_user_role() is not null);

create policy "Non-viewers create bid work items"
on public.bid_work_items for insert to authenticated
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

create policy "Non-viewers update bid work items"
on public.bid_work_items for update to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'))
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

create policy "Non-viewers delete bid work items"
on public.bid_work_items for delete to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

alter table public.calendar_events
  add column if not exists bid_work_item_id uuid references public.bid_work_items(id) on delete cascade;

alter table public.calendar_events drop constraint if exists calendar_events_project_check;
alter table public.calendar_events add constraint calendar_events_project_check check (
  num_nonnulls(project_id, bid_work_item_id, nullif(btrim(manual_project_name), '')) = 1
);

alter table public.calendar_events drop constraint if exists calendar_events_event_type_check;
alter table public.calendar_events add constraint calendar_events_event_type_check
  check (event_type in ('fabrication', 'delivery', 'installation'));

create index if not exists calendar_events_bid_work_item_idx
  on public.calendar_events (bid_work_item_id);
