alter table public.bid_work_items
  add column if not exists work_status text not null default 'not_started';

alter table public.bid_work_items
  drop constraint if exists bid_work_items_work_status_check;

alter table public.bid_work_items
  add constraint bid_work_items_work_status_check check (
    work_status in (
      'not_started',
      'fabrication',
      'delivery',
      'installation',
      'ready_for_billing',
      'paid'
    )
  );

update public.bid_work_items
set work_status = case
  when paid then 'paid'
  when ready_for_billing then 'ready_for_billing'
  when installation_complete then 'installation'
  when delivery_complete then 'delivery'
  when fabrication_complete then 'fabrication'
  else 'not_started'
end;
