-- Apply once in the EXISTING project's SQL Editor; safe to run again.
-- No data deletion, new bucket, or change to admin/moderation policies.
begin;

drop policy if exists "Visitors can upload Ana Styling review photos" on storage.objects;
create policy "Visitors can upload Ana Styling review photos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'ana-styling-media'
  and name ~ '^reviews/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

drop policy if exists "Review submissions require a rating" on public.studio_reviews;
create policy "Review submissions require a rating"
on public.studio_reviews as restrictive for insert to anon, authenticated
with check (
  rating is not null and rating between 1 and 5
  and (
    photo_url is null
    or exists (
      select 1 from storage.objects as photo
      where photo.bucket_id = 'ana-styling-media'
        and photo.name like 'reviews/' || studio_reviews.id::text || '/%'
        and studio_reviews.photo_url = 'https://mmdrnmbhisufsmpluvwh.supabase.co/storage/v1/object/public/ana-styling-media/' || photo.name
        and (photo.metadata->>'size')::bigint between 1 and 10485760
        and photo.metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
    )
  )
);

commit;
