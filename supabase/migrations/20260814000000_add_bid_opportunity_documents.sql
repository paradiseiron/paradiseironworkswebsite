create table if not exists public.bid_opportunity_documents (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunities(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes bigint not null check (size_bytes > 0),
  document_category text not null default 'other'
    check (document_category in ('drawing', 'specification', 'other')),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists bid_opportunity_documents_opportunity_idx
  on public.bid_opportunity_documents (bid_opportunity_id, created_at desc);

alter table public.bid_opportunity_documents enable row level security;

drop policy if exists "Assigned users read bid documents" on public.bid_opportunity_documents;
create policy "Assigned users read bid documents"
on public.bid_opportunity_documents for select
to authenticated
using (
  public.current_user_role() in (
    'admin', 'estimator', 'operations_foreman',
    'bid_estimator', 'project_manager', 'viewer'
  )
);

drop policy if exists "Bid team creates bid documents" on public.bid_opportunity_documents;
create policy "Bid team creates bid documents"
on public.bid_opportunity_documents for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'bid_estimator', 'project_manager')
  and uploaded_by = auth.uid()
);

drop policy if exists "Bid team deletes bid documents" on public.bid_opportunity_documents;
create policy "Bid team deletes bid documents"
on public.bid_opportunity_documents for delete
to authenticated
using (public.current_user_role() in ('admin', 'bid_estimator', 'project_manager'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('bid-opportunity-documents', 'bid-opportunity-documents', false, 26214400)
on conflict (id) do update
set public = false,
    file_size_limit = 26214400;

drop policy if exists "Assigned users read bid document files" on storage.objects;
create policy "Assigned users read bid document files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'bid-opportunity-documents'
  and public.current_user_role() in (
    'admin', 'estimator', 'operations_foreman',
    'bid_estimator', 'project_manager', 'viewer'
  )
);

drop policy if exists "Bid team uploads bid document files" on storage.objects;
create policy "Bid team uploads bid document files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'bid-opportunity-documents'
  and public.current_user_role() in ('admin', 'bid_estimator', 'project_manager')
);

drop policy if exists "Bid team deletes bid document files" on storage.objects;
create policy "Bid team deletes bid document files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'bid-opportunity-documents'
  and public.current_user_role() in ('admin', 'bid_estimator', 'project_manager')
);
