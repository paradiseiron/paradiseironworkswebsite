alter table public.user_roles
  add column if not exists display_name text;

alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'estimator', 'operations_foreman', 'viewer'));

update public.user_roles
set display_name = 'Mikhail'
where role = 'estimator'
  and display_name is null;

insert into public.user_roles (user_id, role, notification_email, display_name)
select id, 'operations_foreman', email, 'Giovanni'
from auth.users
where lower(email) = 'giovannibrown@paradiseironworks.com'
on conflict (user_id) do update
set role = excluded.role,
    notification_email = excluded.notification_email,
    display_name = excluded.display_name,
    updated_at = now();

drop policy if exists "Operational users read project images" on public.project_images;
create policy "Operational users read project images"
on public.project_images for select
to authenticated
using (
  public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
);

drop policy if exists "Operational users insert project images" on public.project_images;
create policy "Operational users insert project images"
on public.project_images for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'estimator', 'operations_foreman')
);

drop policy if exists "Operational users upload project images" on storage.objects;
create policy "Operational users upload project images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and public.current_user_role() in ('admin', 'estimator', 'operations_foreman')
);

drop policy if exists "Operational users read project images" on storage.objects;
create policy "Operational users read project images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'project-images'
  and public.current_user_role() in ('admin', 'estimator', 'operations_foreman', 'viewer')
);

drop policy if exists "Estimator uploads site visit images" on storage.objects;
create policy "Estimator uploads site visit images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-visit-images'
  and public.current_user_role() in ('estimator', 'operations_foreman')
  and (storage.foldername(name))[1] = auth.uid()::text
);
