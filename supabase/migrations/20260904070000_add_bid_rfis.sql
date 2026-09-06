create table if not exists public.bid_rfis (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunities(id) on delete cascade,
  rfi_number integer not null check (rfi_number > 0),
  status text not null default 'draft' check (status in ('draft', 'ready_to_send', 'sent', 'responded', 'closed')),
  subject text not null,
  question text not null default '',
  background text,
  recipient_email text,
  cc_emails text,
  drawing_references text,
  specification_references text,
  requested_response_date date,
  response_text text,
  response_received_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bid_opportunity_id, rfi_number)
);

create table if not exists public.bid_rfi_attachments (
  id uuid primary key default gen_random_uuid(),
  bid_rfi_id uuid not null references public.bid_rfis(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes bigint not null default 0,
  attachment_type text not null default 'request' check (attachment_type in ('request', 'response')),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.bid_rfi_email_history (
  id uuid primary key default gen_random_uuid(),
  bid_rfi_id uuid not null references public.bid_rfis(id) on delete cascade,
  recipient_email text not null,
  cc_emails text,
  subject text not null,
  message_snapshot jsonb not null default '{}'::jsonb,
  sent_by uuid references auth.users(id),
  sent_at timestamptz not null default now()
);

create index if not exists bid_rfis_opportunity_idx on public.bid_rfis (bid_opportunity_id, rfi_number);
create index if not exists bid_rfi_attachments_rfi_idx on public.bid_rfi_attachments (bid_rfi_id, created_at);
create index if not exists bid_rfi_email_history_rfi_idx on public.bid_rfi_email_history (bid_rfi_id, sent_at desc);

alter table public.bid_rfis enable row level security;
alter table public.bid_rfi_attachments enable row level security;
alter table public.bid_rfi_email_history enable row level security;

create policy "Assigned users read bid RFIs" on public.bid_rfis for select to authenticated using (public.current_user_role() is not null);
create policy "Non-viewers create bid RFIs" on public.bid_rfis for insert to authenticated with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Non-viewers update bid RFIs" on public.bid_rfis for update to authenticated using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager')) with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Non-viewers delete bid RFIs" on public.bid_rfis for delete to authenticated using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Assigned users read bid RFI attachments" on public.bid_rfi_attachments for select to authenticated using (public.current_user_role() is not null);
create policy "Non-viewers manage bid RFI attachments" on public.bid_rfi_attachments for all to authenticated using (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager')) with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
create policy "Assigned users read bid RFI email history" on public.bid_rfi_email_history for select to authenticated using (public.current_user_role() is not null);
create policy "Non-viewers create bid RFI email history" on public.bid_rfi_email_history for insert to authenticated with check (public.current_user_role() in ('admin','estimator','operations_foreman','bid_estimator','project_manager'));
