-- Fix for anon user permissions on job_posts table
-- Run this in Supabase SQL Editor

-- Step 1: Drop problematic policies
drop policy if exists "job_posts_insert_authenticated" on public.job_posts;
drop policy if exists "job_posts_insert_anon_pending" on public.job_posts;
drop policy if exists "job_posts_create_public_or_authenticated" on public.job_posts;

-- Step 2: Create working policies
create policy "job_posts_insert_anon" on public.job_posts
for insert to anon
with check (created_by is null and status = 'pending');

create policy "job_posts_insert_authenticated" on public.job_posts
for insert to authenticated
with check (true);

create policy "job_posts_read_approved" on public.job_posts
for select to anon, authenticated
using (status = 'approved');

create policy "job_posts_read_admin" on public.job_posts
for select to authenticated
using (public.is_admin(auth.uid()) or auth.uid() = created_by);

create policy "job_posts_update_admin_owner" on public.job_posts
for update to authenticated
using (public.is_admin(auth.uid()) or auth.uid() = created_by);

-- Step 3: Revoke and re-grant permissions
revoke all on public.job_posts from anon, authenticated;

grant select on public.job_posts to anon;
grant insert, select, update on public.job_posts to authenticated;
grant insert, select, update, delete on public.job_posts to service_role;

-- Specifically grant anon the INSERT permission
alter table public.job_posts enable row level security;
grant insert on public.job_posts to anon;

-- Step 4: Test by running this (should return success)
-- This tests if anon can insert:
-- select exists(select 1 from information_schema.role_table_grants where grantee = 'anon' and table_name = 'job_posts' and privilege_type = 'INSERT');
