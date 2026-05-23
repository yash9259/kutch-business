-- Lotus Career Connect - Supabase schema
-- Run this in Supabase SQL Editor before wiring the frontend.
-- Assumes Supabase Auth will manage login/register in auth.users.
-- WARNING: This script now removes existing app tables, custom types, triggers,
-- functions, storage objects, and buckets created for this project before recreating them.

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated, service_role;

drop policy if exists "candidate resume upload own folder" on storage.objects;
drop policy if exists "candidate resume read own folder" on storage.objects;
drop policy if exists "candidate resume update own folder" on storage.objects;
drop policy if exists "candidate resume delete own folder" on storage.objects;
drop policy if exists "candidate consent upload own folder" on storage.objects;
drop policy if exists "candidate consent read own folder" on storage.objects;
drop policy if exists "candidate consent update own folder" on storage.objects;
drop policy if exists "candidate consent delete own folder" on storage.objects;
drop policy if exists "payment screenshot upload own folder" on storage.objects;
drop policy if exists "payment screenshot read own folder" on storage.objects;
drop policy if exists "payment screenshot update own folder" on storage.objects;
drop policy if exists "payment screenshot delete own folder" on storage.objects;
drop policy if exists "job post attachment upload public" on storage.objects;
drop policy if exists "job post attachment read admin" on storage.objects;
drop policy if exists "job post attachment delete admin" on storage.objects;

do $$
begin
  perform storage.empty_bucket('candidate-resumes');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.empty_bucket('candidate-consent');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.empty_bucket('payment-screenshots');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.empty_bucket('job-post-attachments');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.delete_bucket('candidate-resumes');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.delete_bucket('candidate-consent');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.delete_bucket('payment-screenshots');
exception when others then
  null;
end $$;

do $$
begin
  perform storage.delete_bucket('job-post-attachments');
exception when others then
  null;
end $$;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.notification_recipients cascade;
drop table if exists public.notifications cascade;
drop table if exists public.candidate_payments cascade;
drop table if exists public.subscription_plans cascade;
drop table if exists public.job_applications cascade;
drop table if exists public.saved_jobs cascade;
drop table if exists public.job_posts cascade;
drop table if exists public.candidate_documents cascade;
drop table if exists public.candidate_references cascade;
drop table if exists public.candidate_experience cascade;
drop table if exists public.candidate_education cascade;
drop table if exists public.candidate_job_interests cascade;
drop table if exists public.candidate_profiles cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_auth_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_admin(uuid) cascade;

drop type if exists public.document_type cascade;
drop type if exists public.reference_type cascade;
drop type if exists public.plan_type cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.application_status cascade;
drop type if exists public.job_status cascade;
drop type if exists public.app_role cascade;

create type public.app_role as enum ('candidate', 'admin', 'employer');
create type public.job_status as enum ('pending', 'approved', 'rejected', 'closed');
create type public.application_status as enum ('applied', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn');
create type public.payment_status as enum ('pending', 'submitted', 'verified', 'rejected');
create type public.payment_method as enum ('upi', 'razorpay', 'bank_transfer', 'cash');
create type public.plan_type as enum ('priority_application', 'highlighted_profile', 'featured_candidate', 'custom');
create type public.reference_type as enum ('family', 'friend');
create type public.document_type as enum ('resume', 'signature', 'consent_image', 'payment_screenshot');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'candidate',
  email text not null unique,
  full_name text,
  mobile text,
  is_active boolean not null default true,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  registration_date date not null default current_date,
  gender text,
  dob date,
  marital_status text,
  languages text,
  father_mobile text,
  present_address text,
  permanent_address text,
  highest_education text,
  last_company text,
  current_designation text,
  total_experience text,
  last_salary numeric(12,2),
  expected_salary numeric(12,2),
  city text,
  declaration_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  signature_file_path text,
  consent_image_file_path text,
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_job_interests (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  interest text not null,
  created_at timestamptz not null default now(),
  unique(candidate_id, interest)
);

create table if not exists public.candidate_education (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  degree text not null,
  institution text not null,
  year text,
  percentage text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_experience (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  company text not null,
  designation text not null,
  from_month text,
  to_month text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_references (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  reference_kind public.reference_type not null,
  full_name text not null,
  contact_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id, reference_kind)
);

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  document_type public.document_type not null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint,
  is_active boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create unique index if not exists idx_candidate_documents_active_resume
  on public.candidate_documents(candidate_id, document_type)
  where is_active = true and document_type = 'resume';

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  company_name text not null,
  position text not null,
  vacancy integer default 1,
  gender text,
  experience text,
  qualification text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_range_text text,
  job_time text,
  location text not null,
  industry text,
  skills text[] not null default '{}',
  description text,
  responsibilities text,
  benefits text[] not null default '{}',
  interview_contact_name text,
  interview_contact_number text,
  company_email text not null,
  attachment_file_name text,
  attachment_file_path text,
  attachment_mime_type text,
  attachment_size_bytes bigint,
  status public.job_status not null default 'pending',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_job_posts_status on public.job_posts(status);
create index if not exists idx_job_posts_location on public.job_posts(location);
create index if not exists idx_job_posts_created_by on public.job_posts(created_by);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  job_id uuid not null references public.job_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(candidate_id, job_id)
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  job_id uuid not null references public.job_posts(id) on delete cascade,
  resume_document_id uuid references public.candidate_documents(id) on delete set null,
  status public.application_status not null default 'applied',
  applied_at timestamptz not null default now(),
  shortlisted_at timestamptz,
  interview_at timestamptz,
  rejected_at timestamptz,
  notes text,
  unique(candidate_id, job_id)
);

create index if not exists idx_job_applications_candidate on public.job_applications(candidate_id);
create index if not exists idx_job_applications_job on public.job_applications(job_id);
create index if not exists idx_job_applications_status on public.job_applications(status);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  plan_type public.plan_type not null,
  amount numeric(12,2) not null,
  billing_label text,
  description text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_payments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  payment_method public.payment_method not null default 'upi',
  amount numeric(12,2) not null,
  status public.payment_status not null default 'pending',
  utr_number text,
  paid_at timestamptz,
  screenshot_file_path text,
  screenshot_document_id uuid references public.candidate_documents(id) on delete set null,
  transaction_reference text,
  admin_notes text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_payments_utr_check check (
    utr_number is null or char_length(trim(utr_number)) between 6 and 50
  )
);

create index if not exists idx_candidate_payments_candidate on public.candidate_payments(candidate_id);
create index if not exists idx_candidate_payments_status on public.candidate_payments(status);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  notification_type text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(notification_id, recipient_user_id)
);

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'candidate')
  )
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'role', 'candidate') = 'candidate' then
    insert into public.candidate_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_profiles_set_updated_at on public.candidate_profiles;
create trigger candidate_profiles_set_updated_at before update on public.candidate_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_education_set_updated_at on public.candidate_education;
create trigger candidate_education_set_updated_at before update on public.candidate_education
for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_experience_set_updated_at on public.candidate_experience;
create trigger candidate_experience_set_updated_at before update on public.candidate_experience
for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_references_set_updated_at on public.candidate_references;
create trigger candidate_references_set_updated_at before update on public.candidate_references
for each row execute procedure public.set_updated_at();

drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at before update on public.job_posts
for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_payments_set_updated_at on public.candidate_payments;
create trigger candidate_payments_set_updated_at before update on public.candidate_payments
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.candidate_job_interests enable row level security;
alter table public.candidate_education enable row level security;
alter table public.candidate_experience enable row level security;
alter table public.candidate_references enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.job_posts enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.candidate_payments enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid and role = 'admin' and is_active = true
  );
$$;

create policy "profiles_select_self_or_admin" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_insert_self_or_admin" on public.profiles
for insert with check (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_update_self_or_admin" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "candidate_profiles_select_self_or_admin" on public.candidate_profiles
for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "candidate_profiles_insert_self" on public.candidate_profiles
for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "candidate_profiles_update_self_or_admin" on public.candidate_profiles
for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "candidate_job_interests_self_or_admin_all" on public.candidate_job_interests
for all using (auth.uid() = candidate_id or public.is_admin(auth.uid()))
with check (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_education_self_or_admin_all" on public.candidate_education
for all using (auth.uid() = candidate_id or public.is_admin(auth.uid()))
with check (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_experience_self_or_admin_all" on public.candidate_experience
for all using (auth.uid() = candidate_id or public.is_admin(auth.uid()))
with check (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_references_self_or_admin_all" on public.candidate_references
for all using (auth.uid() = candidate_id or public.is_admin(auth.uid()))
with check (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_documents_select_self_or_admin" on public.candidate_documents
for select using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_documents_insert_self_or_admin" on public.candidate_documents
for insert with check (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_documents_update_self_or_admin" on public.candidate_documents
for update using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_documents_delete_self_or_admin" on public.candidate_documents
for delete using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "job_posts_read_approved" on public.job_posts
for select to anon, authenticated
using (status = 'approved');

create policy "job_posts_read_admin" on public.job_posts
for select to authenticated
using (public.is_admin(auth.uid()) or auth.uid() = created_by);

create policy "job_posts_insert_anon" on public.job_posts
for insert to anon
with check (
  created_by is null 
  and (
    status = 'pending'
    or (
      status = 'approved'
      and exists (
        select 1 from public.site_settings 
        where setting_key = 'job_approval_config' 
        and (setting_value->>'required')::boolean = false
      )
    )
  )
);

create policy "job_posts_insert_authenticated" on public.job_posts
for insert to authenticated
with check (auth.uid() is not null);

create policy "job_posts_update_admin_or_owner" on public.job_posts
for update to authenticated
using (public.is_admin(auth.uid()) or auth.uid() = created_by);

create policy "saved_jobs_self_manage" on public.saved_jobs
for all using (auth.uid() = candidate_id)
with check (auth.uid() = candidate_id);

create policy "subscription_plans_public_read" on public.subscription_plans
for select using (is_active = true or public.is_admin(auth.uid()));

create policy "subscription_plans_admin_manage" on public.subscription_plans
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "job_applications_select_self_or_admin" on public.job_applications
for select using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "job_applications_insert_self" on public.job_applications
for insert with check (auth.uid() = candidate_id);

create policy "job_applications_update_self_or_admin" on public.job_applications
for update using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_payments_select_self_or_admin" on public.candidate_payments
for select using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "candidate_payments_insert_self" on public.candidate_payments
for insert with check (auth.uid() = candidate_id);

create policy "candidate_payments_update_self_or_admin" on public.candidate_payments
for update using (auth.uid() = candidate_id or public.is_admin(auth.uid()));

create policy "notifications_admin_manage" on public.notifications
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "notifications_public_job_submission_create" on public.notifications
for insert
with check (
  auth.uid() is null
  and created_by is null
  and notification_type = 'employer_job_submission'
);

create policy "notification_recipients_select_self_or_admin" on public.notification_recipients
for select using (auth.uid() = recipient_user_id or public.is_admin(auth.uid()));

create policy "notification_recipients_admin_manage" on public.notification_recipients
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "site_settings_admin_only" on public.site_settings
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "site_settings_select_public" on public.site_settings
for select to anon, authenticated
using (true);

insert into public.subscription_plans (slug, name, plan_type, amount, billing_label, description, features)
values
  (
    'priority-application',
    'Priority Application',
    'priority_application',
    199,
    'per application',
    'Application appears at the top for recruiters.',
    array['Top application visibility', 'Priority badge', 'Higher shortlist chance']
  ),
  (
    'highlighted-profile',
    'Highlighted Profile',
    'highlighted_profile',
    499,
    'per month',
    'Profile gets better search visibility.',
    array['Highlighted search card', 'Featured candidate badge', 'Direct employer visibility', 'Priority in matching']
  )
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'candidate-resumes',
    'candidate-resumes',
    false,
    5242880,
    array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'candidate-consent',
    'candidate-consent',
    false,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'payment-screenshots',
    'payment-screenshots',
    false,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  ),
  (
    'job-post-attachments',
    'job-post-attachments',
    false,
    10485760,
    array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
  )
on conflict (id) do nothing;

create policy "candidate resume upload own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'candidate-resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "candidate resume read own folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-resumes'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "candidate resume update own folder" on storage.objects
for update to authenticated
using (
  bucket_id = 'candidate-resumes'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "candidate resume delete own folder" on storage.objects
for delete to authenticated
using (
  bucket_id = 'candidate-resumes'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "candidate consent upload own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'candidate-consent'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "candidate consent read own folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-consent'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "candidate consent update own folder" on storage.objects
for update to authenticated
using (
  bucket_id = 'candidate-consent'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "candidate consent delete own folder" on storage.objects
for delete to authenticated
using (
  bucket_id = 'candidate-consent'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "payment screenshot upload own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "payment screenshot read own folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-screenshots'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "payment screenshot update own folder" on storage.objects
for update to authenticated
using (
  bucket_id = 'payment-screenshots'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "payment screenshot delete own folder" on storage.objects
for delete to authenticated
using (
  bucket_id = 'payment-screenshots'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
);

create policy "job post attachment upload public" on storage.objects
for insert to anon, authenticated
with check (
  bucket_id = 'job-post-attachments'
  and (storage.foldername(name))[1] = 'job-submissions'
);

create policy "job post attachment read admin" on storage.objects
for select to authenticated
using (
  bucket_id = 'job-post-attachments'
  and public.is_admin(auth.uid())
);

create policy "job post attachment delete admin" on storage.objects
for delete to authenticated
using (
  bucket_id = 'job-post-attachments'
  and public.is_admin(auth.uid())
);

insert into public.site_settings (setting_key, setting_value)
values
  ('payment_config', jsonb_build_object('upi_id', '', 'merchant_name', 'kutchh business', 'notes', 'Set live UPI details before production')),
  ('email_config', jsonb_build_object('smtp_host', '', 'smtp_port', '', 'sender_email', '')),
  ('website_config', jsonb_build_object('site_name', 'kutchh business', 'support_contact', '8780254591', 'support_email', 'suppoert@kutchbusiness.com')),
  ('job_approval_config', '{"required": true}'::jsonb)
on conflict (setting_key) do nothing;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant insert on public.job_posts to anon;
grant insert on public.notifications to anon;
grant usage, select on all sequences in schema public to authenticated, anon;
grant execute on all functions in schema public to authenticated, anon;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant usage, select on sequences to authenticated, anon;

alter default privileges in schema public
grant execute on functions to authenticated, anon;
