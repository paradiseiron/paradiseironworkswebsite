insert into public.shop_employees (name, sort_order)
values
  ('Leo', 40),
  ('Jason', 50)
on conflict (name) do update
set active = true,
    sort_order = excluded.sort_order,
    updated_at = now();
