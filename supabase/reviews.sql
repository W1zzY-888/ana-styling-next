begin;

-- Visitor photo policies are configured below, after the reviews table exists.

create table if not exists public.studio_reviews (
  id uuid primary key default gen_random_uuid(),
  studio_id text not null default 'ana-styling',
  name text not null,
  review_text text not null,
  photo_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint studio_reviews_only_ana_styling check (studio_id = 'ana-styling')
);

alter table public.studio_reviews enable row level security;

alter table public.studio_reviews add column if not exists rating smallint;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.studio_reviews'::regclass
      and conname = 'studio_reviews_rating_range'
  ) then
    alter table public.studio_reviews add constraint studio_reviews_rating_range
      check (rating between 1 and 5);
  end if;
end $$;

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

drop policy if exists "Public can read published Ana Styling reviews" on public.studio_reviews;
create policy "Public can read published Ana Styling reviews"
on public.studio_reviews
for select
to anon, authenticated
using (studio_id = 'ana-styling' and published = true);

drop policy if exists "Visitors can submit Ana Styling reviews" on public.studio_reviews;
create policy "Visitors can submit Ana Styling reviews"
on public.studio_reviews
for insert
to anon, authenticated
with check (studio_id = 'ana-styling' and published = false);

drop policy if exists "Admins can read Ana Styling reviews" on public.studio_reviews;
create policy "Admins can read Ana Styling reviews"
on public.studio_reviews
for select
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update Ana Styling reviews" on public.studio_reviews;
create policy "Admins can update Ana Styling reviews"
on public.studio_reviews
for update
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
)
with check (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete Ana Styling reviews" on public.studio_reviews;
create policy "Admins can delete Ana Styling reviews"
on public.studio_reviews
for delete
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

grant select, insert on public.studio_reviews to anon, authenticated;
grant update, delete on public.studio_reviews to authenticated;

commit;
