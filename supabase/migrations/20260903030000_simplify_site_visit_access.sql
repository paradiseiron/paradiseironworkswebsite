drop policy if exists "Estimator uploads site visit images" on storage.objects;
drop policy if exists "Site visit writers upload images" on storage.objects;

create policy "Site visit writers upload images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-visit-images'
  and public.current_user_role() in (
    'admin',
    'estimator',
    'operations_foreman',
    'bid_estimator',
    'project_manager'
  )
  and (storage.foldername(name))[1] = auth.uid()::text
);
