alter table public.cost_intake
  add column if not exists extraction_model text,
  add column if not exists processing_started_at timestamptz,
  add column if not exists extracted_at timestamptz;
