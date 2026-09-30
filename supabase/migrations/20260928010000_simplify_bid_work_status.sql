alter table public.bid_work_items
  drop constraint if exists bid_work_items_work_status_check;

update public.bid_work_items
set work_status = case
  when work_status = 'paid' or paid then 'payment_received'
  when work_status = 'ready_for_billing' or ready_for_billing then 'ready_for_billing'
  when work_status in ('fabrication', 'delivery', 'installation', 'in_progress')
    or fabrication_complete or delivery_complete or installation_complete then 'in_progress'
  else 'not_started'
end;

alter table public.bid_work_items
  add constraint bid_work_items_work_status_check check (
    work_status in ('not_started', 'in_progress', 'ready_for_billing', 'payment_received')
  );
