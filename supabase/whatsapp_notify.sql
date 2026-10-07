-- Run once in the Supabase SQL editor (existing databases).
-- Used by the notify-whatsapp-new-job edge function to avoid duplicate WhatsApp alerts.
alter table public.job_posts
  add column if not exists whatsapp_notified_at timestamptz;
