-- Kutch Business: no-login apply, no payments, direct job posting
-- Run once in Supabase SQL Editor. Safe to re-run. Nothing is deleted.

-- 1) Applications without an account ---------------------------------------
alter table public.job_applications alter column candidate_id drop not null;

alter table public.job_applications
  add column if not exists applicant_name text,
  add column if not exists applicant_phone text,
  add column if not exists applicant_email text,
  add column if not exists applicant_city text,
  add column if not exists applicant_message text,
  add column if not exists applicant_resume_path text,
  add column if not exists applicant_resume_name text;

alter table public.job_applications drop constraint if exists job_applications_applicant_check;
alter table public.job_applications add constraint job_applications_applicant_check check (
  candidate_id is not null
  or (
    char_length(trim(coalesce(applicant_name, ''))) >= 2
    and applicant_phone ~ '^[0-9]{10}$'
  )
);

-- one application per phone number per job (stops double submits)
create unique index if not exists uq_job_applications_guest_phone
  on public.job_applications(job_id, applicant_phone)
  where candidate_id is null;

drop policy if exists "job_applications_insert_public" on public.job_applications;
create policy "job_applications_insert_public" on public.job_applications
for insert to anon, authenticated
with check (
  candidate_id is null
  and exists (select 1 from public.job_posts jp where jp.id = job_id and jp.status = 'approved')
);

-- 2) Resume upload for people who are not logged in -------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-resumes', 'application-resumes', false, 5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

drop policy if exists "application resume upload public" on storage.objects;
create policy "application resume upload public" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'application-resumes' and (storage.foldername(name))[1] = 'guest');

drop policy if exists "application resume read admin" on storage.objects;
create policy "application resume read admin" on storage.objects
for select to authenticated
using (bucket_id = 'application-resumes' and public.is_admin(auth.uid()));

drop policy if exists "application resume delete admin" on storage.objects;
create policy "application resume delete admin" on storage.objects
for delete to authenticated
using (bucket_id = 'application-resumes' and public.is_admin(auth.uid()));

-- 3) Jobs go live directly, no approval --------------------------------------
drop policy if exists "job_posts_insert_anon" on public.job_posts;
create policy "job_posts_insert_anon" on public.job_posts
for insert to anon
with check (created_by is null and status = 'approved');

alter table public.job_posts alter column status set default 'approved';

-- publish anything that was waiting for approval
update public.job_posts set status = 'approved', approved_at = coalesce(approved_at, now())
where status = 'pending';

-- 4) Payments: the payment tables are left untouched (no data is lost),
--    but the app no longer reads or writes them.
