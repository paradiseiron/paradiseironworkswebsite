alter table public.projects
add column if not exists proposal_first_downloaded_at timestamptz;

comment on column public.projects.proposal_first_downloaded_at is
  'Timestamp of the first successful proposal PDF download. Used to ensure the lead-to-quoted transition occurs only once.';
