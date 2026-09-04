update public.projects
set contact_name = null,
    updated_at = now()
where contact_name is not null
  and lower(trim(contact_name)) = lower(trim(customer_name));

comment on column public.projects.customer_name is
  'Customer account, household, or company name used as the primary project label.';

comment on column public.projects.contact_name is
  'Optional individual point of contact. Leave null when it is the same as the customer name.';
