# Supabase Secrets Configuration

## Your Credentials
- **Resend API Key:** `re_EhimbPQs_GkpN3v5G1b32s1hMLYiDDKgS`
- **Sender Email:** `info@codinghunters.in`
- **Sender Name:** `Codinghunters`

## Setup Instructions

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://app.supabase.com → Select your project
2. Click **Settings** (left sidebar)
3. Click **Secrets** under "Development"
4. Click **New Secret** and add these three:

```
Name: RESEND_API_KEY
Value: re_EhimbPQs_GkpN3v5G1b32s1hMLYiDDKgS
```

```
Name: RESEND_FROM_EMAIL
Value: info@codinghunters.in
```

```
Name: SENDER_NAME
Value: Codinghunters
```

5. Click "Save all" at the bottom

### Option 2: Via Supabase CLI

```bash
# From your project directory
supabase secrets set RESEND_API_KEY=re_EhimbPQs_GkpN3v5G1b32s1hMLYiDDKgS
supabase secrets set RESEND_FROM_EMAIL=info@codinghunters.in
supabase secrets set SENDER_NAME=Codinghunters
```

## Deploy the Edge Function

```bash
# Make sure you're in the project root directory
supabase functions deploy send-employer-email
```

You should see:
```
✓ Function send-employer-email deployed successfully
  URL: https://xxxxx.functions.supabase.co/send-employer-email
```

## Test It

1. Go to your app at `/post-job` (the public job posting form)
2. Fill in a sample job with these details:
   - Company Name: `Test Company`
   - Company Email: **your email** (so you receive the test email)
   - Position: `Test Developer`
   - Other fields: Fill as needed
3. Click "Submit for Review"
4. Check your email inbox in 30 seconds
5. You should get an email from: `Codinghunters <info@codinghunters.in>`

### If Email Doesn't Arrive

1. **Check spam folder** - Add to contacts first
2. **Verify secrets were saved:**
   ```bash
   supabase secrets list
   ```
   Should show all 3 secrets you created

3. **Check Supabase logs:**
   - Go to Project → Logs → Functions
   - Look for `send-employer-email` logs
   - Click to see any error messages

## Email Preview

You'll receive 3 types of emails:

**1. Submission (auto-sent on job post)**
- From: `Codinghunters <info@codinghunters.in>`
- Subject: `Job Submission Received: Test Developer at Test Company`
- Shows job ID and confirmation that it's under review

**2. Approval (when admin approves)**
- From: `Codinghunters <info@codinghunters.in>`
- Subject: `Job Approved: Test Developer is now live! ✅`
- Shows link to view job on platform

**3. Rejection (when admin rejects)**
- From: `Codinghunters <info@codinghunters.in>`
- Subject: `Job Submission Needs Revision: Test Developer`
- Shows admin's feedback reason

## Next: Test Admin Panel

1. Go to `/admin/jobs` (you may need to be logged in as admin)
2. Click "Approve" on your test job
3. Enter your email in the confirmation dialog
4. You should receive the approval email

Done! Your email system is now live with Codinghunters branding! 🎉
