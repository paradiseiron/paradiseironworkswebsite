create or replace function public.derive_bid_work_item_completion_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  total_billed numeric;
begin
  total_billed := coalesce(new.previous_billing, 0) + coalesce(new.current_billing, 0) + coalesce(new.stored_materials, 0);
  new.completion_status := case
    when abs(total_billed) < 0.005 or abs(coalesce(new.scheduled_value, 0)) < 0.005 then 'not_completed'
    when abs(total_billed) >= abs(new.scheduled_value) - 0.01 then 'completed'
    else 'partially_completed'
  end;
  return new;
end;
$$;

drop trigger if exists derive_bid_work_item_completion_status_trigger on public.bid_work_items;
create trigger derive_bid_work_item_completion_status_trigger
before insert or update of scheduled_value, previous_billing, current_billing, stored_materials
on public.bid_work_items
for each row execute function public.derive_bid_work_item_completion_status();

update public.bid_work_items
set completion_status = case
  when abs(coalesce(previous_billing, 0) + coalesce(current_billing, 0) + coalesce(stored_materials, 0)) < 0.005
    or abs(coalesce(scheduled_value, 0)) < 0.005 then 'not_completed'
  when abs(coalesce(previous_billing, 0) + coalesce(current_billing, 0) + coalesce(stored_materials, 0)) >= abs(scheduled_value) - 0.01 then 'completed'
  else 'partially_completed'
end;
