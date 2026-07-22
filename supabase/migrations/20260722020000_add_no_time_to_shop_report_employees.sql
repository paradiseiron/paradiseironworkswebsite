alter table public.daily_shop_report_employees
  add column if not exists no_time_to_report boolean not null default false;

alter table public.daily_shop_report_employees
  drop constraint if exists daily_shop_report_employees_no_time_total_check;

alter table public.daily_shop_report_employees
  add constraint daily_shop_report_employees_no_time_total_check
  check (not no_time_to_report or total_minutes = 0);
