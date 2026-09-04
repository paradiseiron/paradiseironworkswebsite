create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  contact_name text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists projects_customer_id_received_at_idx
  on public.projects (customer_id, received_at desc);

insert into public.customers (
  name, name_key, contact_name, phone, email, address, city, state, zip_code,
  created_at, updated_at
)
select distinct on (regexp_replace(lower(trim(customer_name)), '\s+', ' ', 'g'))
  trim(customer_name),
  regexp_replace(lower(trim(customer_name)), '\s+', ' ', 'g'),
  nullif(trim(contact_name), ''),
  nullif(trim(phone), ''),
  nullif(trim(email), ''),
  nullif(trim(project_address), ''),
  nullif(trim(city), ''),
  nullif(trim(state), ''),
  nullif(trim(zip_code), ''),
  coalesce(received_at, now()),
  coalesce(updated_at, received_at, now())
from public.projects
where nullif(trim(customer_name), '') is not null
order by
  regexp_replace(lower(trim(customer_name)), '\s+', ' ', 'g'),
  updated_at desc nulls last,
  received_at desc nulls last;

update public.projects as project
set customer_id = customer.id
from public.customers as customer
where project.customer_id is null
  and customer.name_key = regexp_replace(lower(trim(project.customer_name)), '\s+', ' ', 'g');

alter table public.customers enable row level security;

drop policy if exists "Assigned users read customers" on public.customers;
create policy "Assigned users read customers"
on public.customers for select
to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager', 'viewer'));

drop policy if exists "Operational users create customers" on public.customers;
create policy "Operational users create customers"
on public.customers for insert
to authenticated
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman'));
drop policy if exists "Operational users update customers" on public.customers;
create policy "Operational users update customers"
on public.customers for update
to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman'))
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman'));
