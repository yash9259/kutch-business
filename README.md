# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Candidate Auth: Phase-Wise Backend Plan

This project now includes a Phase-1 candidate auth backend simulation in the frontend (localStorage + route guards) so you can test login/register immediately.

### Phase 1 (Implemented now): Local backend simulation

- Candidate register saves user data in `localStorage`.
- Candidate login checks saved credentials and creates a session token.
- Admin login is supported with:
	- Email: `admin@hkjobs.com`
	- Password: `admin123`
- Protected routes:
	- Candidate routes: `/dashboard/*`
	- Admin route: `/admin`

### Phase 2: Real Auth API (Node/Express + PostgreSQL)

- Create APIs:
	- `POST /api/auth/register-candidate`
	- `POST /api/auth/login`
	- `POST /api/auth/logout`
	- `GET /api/auth/me`
- Replace localStorage user store with DB tables:
	- `users`
	- `candidate_profiles`
	- `sessions` (optional when using refresh tokens)
- Use password hashing (`bcrypt`) and JWT access/refresh tokens.

### Phase 3: Candidate Profile Domain APIs

- Create candidate CRUD APIs:
	- `GET /api/candidate/profile`
	- `PUT /api/candidate/profile`
	- `POST /api/candidate/resume`
	- `PUT /api/candidate/education`
	- `PUT /api/candidate/experience`
	- `PUT /api/candidate/references`
- Move registration flow fields into normalized profile tables.

### Phase 4: Security + Verification

- Add email verification OTP.
- Add password reset flow.
- Add login throttling and account lock policy.
- Add audit logs for auth and profile updates.

### Phase 5: Production Hardening

- Add API validation (Zod/class-validator) and centralized error handling.
- Add observability (request logs + metrics).
- Add integration tests for auth and profile routes.
- Add CI checks for lint, tests, and migrations.
