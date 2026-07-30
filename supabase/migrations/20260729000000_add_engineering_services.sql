alter table public.projects
add column if not exists engineering_services text;

alter table public.projects
drop constraint if exists projects_engineering_services_check;

update public.projects
set engineering_services = 'Paradise provides Engineer'
where engineering_services = 'We provide Engineer';

alter table public.projects
add constraint projects_engineering_services_check
check (
  engineering_services is null
  or engineering_services in (
    'Client provides Engineer',
    'Paradise provides Engineer',
    'Opt out of Engineer'
  )
);
