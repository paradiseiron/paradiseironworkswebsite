alter table public.bid_work_items
  add column if not exists item_type text not null default 'original_contract',
  add column if not exists change_order_number text,
  add column if not exists change_order_approval_status text,
  add column if not exists change_order_approved_at date;

alter table public.bid_work_items drop constraint if exists bid_work_items_item_type_check;
alter table public.bid_work_items add constraint bid_work_items_item_type_check
  check (item_type in ('original_contract', 'change_order'));

alter table public.bid_work_items drop constraint if exists bid_work_items_change_order_approval_check;
alter table public.bid_work_items add constraint bid_work_items_change_order_approval_check check (
  (item_type = 'original_contract' and change_order_approval_status is null)
  or
  (item_type = 'change_order' and change_order_approval_status in ('proposed', 'pending_approval', 'approved', 'rejected'))
);

alter table public.bid_work_items drop constraint if exists bid_work_items_scheduled_value_check;
alter table public.bid_work_items add constraint bid_work_items_scheduled_value_check check (
  scheduled_value is null or item_type = 'change_order' or scheduled_value >= 0
);
