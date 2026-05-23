-- Fix for site_settings public read and job_posts dynamic approval status
-- Run this in Supabase SQL Editor

-- 1. Insert default setting for job approval config
insert into public.site_settings (setting_key, setting_value)
values ('job_approval_config', '{"required": true}'::jsonb)
on conflict (setting_key) do nothing;

-- 2. Drop existing public select policy on site_settings if it exists
drop policy if exists "site_settings_select_public" on public.site_settings;

-- 3. Create public select policy on site_settings so clients can fetch the config
create policy "site_settings_select_public" on public.site_settings
for select to anon, authenticated
using (true);

-- 4. Re-grant select privileges on site_settings table to anon and authenticated
grant select on public.site_settings to anon, authenticated;

-- 5. Drop the old job_posts_insert_anon policy
drop policy if exists "job_posts_insert_anon" on public.job_posts;

-- 6. Recreate job_posts_insert_anon with dynamic check on job_approval_config
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
