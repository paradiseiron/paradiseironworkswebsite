create table if not exists public.bid_post_win_checklist_items (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunities(id) on delete cascade,
  template_key text,
  task text not null check (btrim(task) <> ''),
  owner_name text,
  due_date date,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete', 'not_applicable')),
  notes text,
  is_standard boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bid_opportunity_id, template_key)
);

create index if not exists bid_post_win_checklist_opportunity_idx
  on public.bid_post_win_checklist_items (bid_opportunity_id, sort_order, created_at);

alter table public.bid_post_win_checklist_items enable row level security;

create policy "Assigned users read post bid checklists"
on public.bid_post_win_checklist_items for select to authenticated
using (public.current_user_role() is not null);

create policy "Non-viewers create post bid checklist items"
on public.bid_post_win_checklist_items for insert to authenticated
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

create policy "Non-viewers update post bid checklist items"
on public.bid_post_win_checklist_items for update to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'))
with check (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

create policy "Non-viewers delete post bid checklist items"
on public.bid_post_win_checklist_items for delete to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'bid_estimator', 'project_manager'));

create or replace function public.seed_post_bid_win_checklist(target_bid_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.bid_post_win_checklist_items
    (bid_opportunity_id, template_key, task, is_standard, sort_order)
  values
    (target_bid_id, 'review-award', 'Review award / final bid', true, 10),
    (target_bid_id, 'confirm-scope', 'Confirm final scope', true, 20),
    (target_bid_id, 'review-subcontract', 'Review subcontract', true, 30),
    (target_bid_id, 'execute-subcontract', 'Execute subcontract', true, 40),
    (target_bid_id, 'contract-value', 'Confirm contract value', true, 50),
    (target_bid_id, 'project-contacts', 'Confirm key project contacts', true, 60),
    (target_bid_id, 'project-schedule', 'Confirm project schedule / milestones', true, 70),
    (target_bid_id, 'insurance', 'Confirm insurance requirements / COI', true, 80),
    (target_bid_id, 'bond', 'Determine bond requirement', true, 90),
    (target_bid_id, 'initial-sov', 'Create initial SOV', true, 100),
    (target_bid_id, 'billing', 'Confirm billing requirements', true, 110),
    (target_bid_id, 'submittal-register', 'Create submittal register', true, 120),
    (target_bid_id, 'shop-drawings', 'Identify initial shop drawings required', true, 130),
    (target_bid_id, 'initial-rfis', 'Identify initial RFIs / scope questions', true, 140),
    (target_bid_id, 'change-orders', 'Confirm change-order process', true, 150),
    (target_bid_id, 'handoff', 'Kickoff / handoff completed', true, 160),
    (target_bid_id, 'ready-for-execution', 'Ready for project execution', true, 170)
  on conflict (bid_opportunity_id, template_key) do nothing;
$$;

create or replace function public.seed_checklist_when_bid_won()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'won' and (tg_op = 'INSERT' or old.status is distinct from 'won') then
    perform public.seed_post_bid_win_checklist(new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.seed_post_bid_win_checklist(uuid) from public, anon, authenticated;
revoke all on function public.seed_checklist_when_bid_won() from public, anon, authenticated;

drop trigger if exists seed_post_bid_win_checklist_trigger on public.bid_opportunities;
create trigger seed_post_bid_win_checklist_trigger
after insert or update of status on public.bid_opportunities
for each row execute function public.seed_checklist_when_bid_won();

select public.seed_post_bid_win_checklist(id)
from public.bid_opportunities
where status = 'won';
