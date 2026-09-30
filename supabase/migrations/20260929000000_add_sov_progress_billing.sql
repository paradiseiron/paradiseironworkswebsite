alter table public.bid_work_items
  add column if not exists completion_status text not null default 'not_completed',
  add column if not exists previous_billing numeric(14,2) not null default 0,
  add column if not exists current_billing numeric(14,2) not null default 0,
  add column if not exists stored_materials numeric(14,2) not null default 0,
  add column if not exists retainage_amount numeric(14,2) not null default 0,
  add column if not exists billing_application_number text,
  add column if not exists billing_period_to date,
  add column if not exists billing_source_document text;

alter table public.bid_work_items drop constraint if exists bid_work_items_completion_status_check;
alter table public.bid_work_items add constraint bid_work_items_completion_status_check
  check (completion_status in ('not_completed', 'partially_completed', 'completed'));

update public.bid_work_items
set completion_status = case
  when paid or work_status in ('paid', 'payment_received') then 'completed'
  when work_status in ('fabrication', 'delivery', 'installation', 'in_progress', 'ready_for_billing') then 'partially_completed'
  else 'not_completed'
end;
