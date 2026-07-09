alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'estimator', 'viewer'));

drop policy if exists "Operational users read project images" on public.project_images;
create policy "Operational users read project images"
on public.project_images for select
to authenticated
using (public.current_user_role() in ('admin', 'estimator', 'viewer'));

drop policy if exists "Operational users read project images" on storage.objects;
create policy "Operational users read project images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'project-images'
  and public.current_user_role() in ('admin', 'estimator', 'viewer')
);

drop policy if exists "Estimator reads own site visit images" on storage.objects;
create policy "Estimator reads own site visit images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'site-visit-images'
  and (
    public.current_user_role() in ('admin', 'viewer')
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
