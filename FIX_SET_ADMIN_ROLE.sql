-- Promote specific user to admin role
-- Run this in Supabase SQL Editor

update public.profiles
set
  role = 'admin',
  email = 'admin@kutchbusiness.com',
  is_active = true,
  updated_at = now()
where id = '2ad8d6f9-d4ea-41d0-ad22-0b0b24c4367d'::uuid;

-- Safety: if the UUID row does not exist but email exists, promote that row too.
update public.profiles
set
  role = 'admin',
  is_active = true,
  updated_at = now()
where email = 'admin@kutchbusiness.com';
