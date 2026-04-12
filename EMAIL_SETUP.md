# Employer Email System Setup Guide

## Overview
This app now sends professional emails to employers when they submit jobs and when admins approve/reject submissions. Uses **Resend API** + **Supabase Edge Function**.

## Quick Setup (5 minutes)

### 1. Get Resend API Key
- Go to https://resend.com and sign up (free tier available)
- Create API key from dashboard
- Copy the key (starts with `re_`)

### 2. Add Secrets to Supabase
```bash
# Option A: Via Supabase Dashboard
1. Go to https://app.supabase.com → Your Project
2. Settings → Secrets
3. Create new secret:
   - Name: RESEND_API_KEY
   - Value: re_xxxxxxxxxxxxx
4. Create another secret:
   - Name: RESEND_FROM_EMAIL
   - Value: noreply@lotus-career-connect.com

# Option B: Via CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=noreply@lotus-career-connect.com
```

### 3. Deploy Edge Function
```bash
cd /path/to/lotus-career-connect
supabase functions deploy send-employer-email
```

You should see:
```
✓ Function send-employer-email deployed successfully
  URL: https://[id].functions.supabase.co/send-employer-email
```

### 4. Test It
1. Go to `/post-job` page (public form)
2. Fill in job details and submit
3. Check the employer's email inbox (uses company email from form)
4. You should receive "Job Submission Received" email

## Email System Details

### Emails Sent

**1. Submission Confirmation** → When employer posts job
- Title: "Job Submission Received"
- Shows: Job ID, Position, Company Name
- Sets expectations for review process

**2. Approval** → When admin approves
- Title: "Job Approved & Live! ✅"
- Shows: Job info + link to platform
- Call-to-action: View job on platform

**3. Rejection** → When admin rejects
- Title: "Job Submission Needs Revision"
- Shows: Rejection reason from admin
- Guidance: How to fix and resubmit

### File Locations

```
supabase/functions/send-employer-email/
└── index.ts              # Edge Function that sends via Resend

src/lib/employerJobs.ts
├── submitEmployerJob()   # Handles job submission + sends email
├── sendEmployerEmail()   # Calls Edge Function
└── updateJobStatusWithEmail() # Handles approval/rejection + sends email

src/pages/admin/JobReview.tsx
└── # Admin panel for reviewing pending jobs and sending status emails

src/pages/PostJob.tsx
└── # Public job submission form (auto-sends confirmation email)
```

## How It Works (Diagram)

```
Employer Posts Job
       ↓
   [PostJob.tsx]
       ↓
submitEmployerJob()
   ├→ Upload file to storage
   ├→ Insert job_posts row (status=pending)
   ├→ Create admin notification
   └→ sendEmployerEmail(type='submitted')
       ├→ HTTP POST to Edge Function
       ├→ Edge Function formats HTML template
       └→ Resend API sends email
           ↓
       Employer gets confirmation email
       ↓
   [JobReview.tsx - Admin Panel]
       ↓
Admin clicks Approve/Reject
       ↓
updateJobStatusWithEmail()
   ├→ Update job_posts (status='approved'/'rejected')
   └→ sendEmployerEmail(type='approved'/'rejected')
       ├→ HTTP POST to Edge Function
       ├→ Edge Function formats approval/rejection template
       └→ Resend API sends email
           ↓
       Employer gets status email
```

## Troubleshooting

### "Email sending failed" message
**Problem:** Edge Function not deployed or secrets not set
**Solution:**
```bash
# Check if function exists
supabase functions list

# If not listed, deploy:
supabase functions deploy send-employer-email

# Check if secrets are set
supabase secrets list
```

### Job status changes but email doesn't send
**Problem:** Resend API key is invalid or missing
**Solution:**
1. Verify `RESEND_API_KEY` secret is set in Supabase
2. Make sure key starts with `re_` (not staging key)
3. Check Supabase logs: Project → Logs → Functions

### Email shows as sent but employer doesn't receive it
**Problem:** Email address might be spam-filtered or invalid format
**Solution:**
- Check `company_email` in form is valid
- Ask employer to check spam folder
- Test with your own email first

## Environment Variables (Frontend)

These are auto-populated from Vite config:
```
VITE_SUPABASE_URL=xxxxx
VITE_SUPABASE_ANON_KEY=xxxxx
```

The Edge Function automatically reads the secrets (no frontend access needed to API keys).

## Production Readiness

- ✅ Professional email templates
- ✅ Error logging
- ✅ Graceful fallback (job still saves if email fails)
- ✅ Mobile-friendly templates
- ✅ No sensitive data in emails

## Next Steps (Optional)

1. **Custom email domain:** Use custom domain in Resend instead of `noreply@lotus-career-connect.com`
2. **Email templates:** Customize HTML templates in Edge Function
3. **Additional emails:** Send emails to candidates on application status changes
4. **Email tracking:** Add Resend webhook to track open/click rates

## Support

For Resend help: https://resend.com/docs
For Supabase Edge Functions: https://supabase.com/docs/guides/functions
