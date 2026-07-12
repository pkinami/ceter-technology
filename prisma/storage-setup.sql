insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('website-media', 'website-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('product-videos', 'product-videos', true, 104857600, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read CETER media'
  ) then
    create policy "Public read CETER media"
    on storage.objects
    for select
    using (bucket_id in ('product-images', 'website-media', 'product-videos'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins insert CETER media'
  ) then
    create policy "Admins insert CETER media"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id in ('product-images', 'website-media', 'product-videos')
      and exists (
        select 1
        from public."User"
        where id = auth.uid()::text
          and role::text = 'ADMIN'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins update CETER media'
  ) then
    create policy "Admins update CETER media"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id in ('product-images', 'website-media', 'product-videos')
      and exists (
        select 1
        from public."User"
        where id = auth.uid()::text
          and role::text = 'ADMIN'
      )
    )
    with check (
      bucket_id in ('product-images', 'website-media', 'product-videos')
      and exists (
        select 1
        from public."User"
        where id = auth.uid()::text
          and role::text = 'ADMIN'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins delete CETER media'
  ) then
    create policy "Admins delete CETER media"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id in ('product-images', 'website-media', 'product-videos')
      and exists (
        select 1
        from public."User"
        where id = auth.uid()::text
          and role::text = 'ADMIN'
      )
    );
  end if;
end $$;
