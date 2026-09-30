create table if not exists public.cost_intake (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status text not null default 'needs_review'
    check (status in ('uploaded', 'processing', 'needs_review', 'approved', 'rejected', 'failed')),
  vendor_name text,
  amount numeric(12,2) check (amount is null or amount >= 0),
  document_date date,
  invoice_number text,
  purchase_order_number text,
  category text check (category is null or category in ('materials','labor','subcontractor','equipment','rental','freight_delivery','permits_fees','fuel','other')),
  description text,
  extraction_data jsonb not null default '{}'::jsonb,
  extraction_confidence jsonb not null default '{}'::jsonb,
  failure_message text,
  uploaded_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  source_intake_id uuid unique references public.cost_intake(id) on delete set null,
  vendor_name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  document_date date not null,
  invoice_number text,
  purchase_order_number text,
  category text not null check (category in ('materials','labor','subcontractor','equipment','rental','freight_delivery','permits_fees','fuel','other')),
  description text,
  storage_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cost_intake_status_created_idx on public.cost_intake(status, created_at desc);
create index if not exists cost_intake_project_idx on public.cost_intake(project_id);
create index if not exists project_costs_project_date_idx on public.project_costs(project_id, document_date desc);

alter table public.cost_intake enable row level security;
alter table public.project_costs enable row level security;

create policy "Assigned users read cost intake" on public.cost_intake for select to authenticated
using (public.current_user_role() is not null);
create policy "Non-viewers create cost intake" on public.cost_intake for insert to authenticated
with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager') and uploaded_by = auth.uid());
create policy "Non-viewers update cost intake" on public.cost_intake for update to authenticated
using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'))
with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Assigned users read project costs" on public.project_costs for select to authenticated
using (public.current_user_role() is not null);
create policy "Non-viewers create project costs" on public.project_costs for insert to authenticated
with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager') and created_by = auth.uid());
create policy "Non-viewers update project costs" on public.project_costs for update to authenticated
using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'))
with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cost-documents', 'cost-documents', false, 26214400, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 26214400,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp'];

create policy "Assigned users read cost documents" on storage.objects for select to authenticated
using (bucket_id = 'cost-documents' and public.current_user_role() is not null);
create policy "Non-viewers upload cost documents" on storage.objects for insert to authenticated
with check (bucket_id = 'cost-documents' and public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Non-viewers delete cost documents" on storage.objects for delete to authenticated
using (bucket_id = 'cost-documents' and public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
