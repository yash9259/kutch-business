# Supabase Setup Notes

Run `schema.sql` in Supabase SQL Editor first.

Buckets created by the SQL:
- `candidate-resumes`
- `candidate-consent`
- `payment-screenshots`
- `job-post-attachments`

Recommended storage paths:
- `candidate-resumes/<user_id>/<timestamp>-resume.pdf`
- `candidate-consent/<user_id>/<timestamp>-signature.png`
- `candidate-consent/<user_id>/<timestamp>-consent-image.jpg`
- `payment-screenshots/<user_id>/<timestamp>-payment-proof.jpg`
- `job-post-attachments/job-submissions/<timestamp>-job-details.pdf`

Important fields already included in SQL:
- Candidate register/login via `auth.users` + `profiles`
- Candidate profile tables for personal info, education, experience, references
- `declaration_accepted` and `terms_accepted_at` on `candidate_profiles`
- Resume documents table
- Job posts and applications
- `attachment_file_name`, `attachment_file_path`, `attachment_mime_type`, and `attachment_size_bytes` on `job_posts`
- Public employer submissions can insert pending jobs directly into `job_posts`
- Employer job submissions also insert an admin notification row into `notifications`
- Premium plans and candidate payments
- `utr_number` field on `candidate_payments`
- `screenshot_file_path` and `screenshot_document_id` for payment proof

If your live Supabase project was created before `terms_accepted_at` was added, run this once:

```sql
alter table public.candidate_profiles
add column if not exists terms_accepted_at timestamptz;
```

Suggested employer job submission flow:
1. Employer fills the public post-job form.
2. Employer can upload a JD or supporting file to `job-post-attachments`.
3. Frontend inserts a pending row into `job_posts`.
4. Frontend inserts a related admin notification row into `notifications`.
5. Admin reviews the submission and attachment from the admin panel.

Important email note:
- ✅ This repo now has a complete Resend-based email system for employer job status updates.
- When an employer submits a job, they receive a confirmation email.
- When admin approves/rejects, employer receives status update email with feedback.
- Uses Supabase Edge Function at `/supabase/functions/send-employer-email/` to send via Resend API.

**Email Setup Required:**

1. **Add Resend API Key to Supabase Secrets:**
   - Go to Supabase → Project Settings → Secrets
   - Create new secret: `RESEND_API_KEY` with your Resend API key (get from https://resend.com)
   - Create new secret: `RESEND_FROM_EMAIL` with your sending email (e.g., `noreply@lotus-career-connect.com`)

2. **Deploy Edge Function:**
   ```bash
   # Run from project root
   supabase functions deploy send-employer-email
   ```

3. **Email Types Sent:**
   - `submitted`: Confirmation when employer posts job. Shows job ID, position, company name.
   - `approved`: Approval email with link to view job on platform.
   - `rejected`: Rejection email with admin's feedback reason.

4. **Email Flow in Code:**
   - Frontend: `PostJob.tsx` calls `submitEmployerJob()` which sends "submitted" email
   - Admin: `JobReview.tsx` calls `updateJobStatusWithEmail()` which sends: "approved" or "rejected"
   - Edge Function: Receives request, formats email template, sends via Resend API
   - Fallback: If email fails, job status still updates; email error logged but doesn't block

**Employer Job Submission Flow (with emails):**
1. Employer fills form on `/post-job` page (public, no auth required)
2. Optionally uploads JD file
3. Frontend calls `submitEmployerJob()` → stores in DB + sends confirmation email to employer
4. Notification row created for admin review
5. Admin reviews job on `/admin/jobs` page
6. Admin clicks Approve → email sent to employer with approval
7. Admin clicks Reject → admin enters reason → rejection email sent
8. Employer receives all emails at their company email address

Suggested frontend flow for payment proof:
1. Candidate selects plan.
2. Candidate pays via UPI/manual payment.
3. Candidate uploads screenshot.
4. Candidate enters `utr_number`.
5. Insert row into `candidate_payments` with `status = 'submitted'`.
6. Admin verifies and updates status to `verified` or `rejected`.
