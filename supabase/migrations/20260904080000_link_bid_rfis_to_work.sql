alter table public.bid_rfis
  add column if not exists affected_work_item_ids uuid[] not null default '{}',
  add column if not exists resulting_change_order_id uuid references public.bid_work_items(id) on delete set null;
