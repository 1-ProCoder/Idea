# FlowFix AI

> AI receptionist, scheduler, and job-management for plumbing, electrical, and HVAC businesses. Never miss a call. Never double-book a job.

**Status:** Milestone 1 in progress — project setup, authentication, database.

See [Build Order](#build-order) for the full 10-milestone roadmap.

---

## What it does

A production-ready SaaS for service businesses (1–10 workers). The system:

1. Answers inbound calls with an AI voice receptionist.
2. Captures customer details (name, phone, address, problem).
3. Detects emergencies and escalates immediately.
4. Books appointments onto staff calendars automatically.
5. Prevents double-bookings with realtime availability checks.
6. Creates jobs and dispatches them to the right worker.
7. Sends confirmations via SMS and email.
8. Provides a dashboard for managing customers, calls, jobs, and staff.

---

## Target users

- Plumbing businesses
- Electrical businesses
- HVAC businesses

Typical company size: 1–10 workers.

---

## Tech stack

| Layer             | Choice                                       | Notes                                  |
| ----------------- | -------------------------------------------- | -------------------------------------- |
| Frontend          | Vite, React, TypeScript                      | SPA, deployed to Vercel                |
| UI                | Tailwind CSS                                 | Utility-first styling                  |
| Data fetching     | TanStack Query                               | Server-state caching                   |
| Routing           | React Router                                 | SPA navigation                         |
| Auth              | Clerk                                        | Sign-in/up, sessions, MFA              |
| Backend           | Node.js, Express, TypeScript                 | Deployed to Railway                    |
| ORM               | Prisma                                       | Type-safe DB access                    |
| Database          | PostgreSQL                                   | Production + local dev                 |
| Realtime *(later)*| Socket.IO                                    | Calendar + job updates                 |
| Payments *(later)*| Stripe                                       | Subscriptions                          |
| Voice *(later)*   | Twilio + Deepgram + Claude API               | AI receptionist                        |
| Maps *(later)*    | Google Maps API                              | Dispatch visualisation                 |

---

## Project structure

Monorepo using **npm workspaces**.

```
.
├── apps/
│   ├── web/         # React + Vite SPA (deploy to Vercel)
│   └── api/         # Express + Prisma backend (deploy to Railway)
├── packages/
│   └── shared/      # Shared TypeScript types & enums
├── README.md
└── package.json     # Workspace root
```

---

## Getting started

### Prerequisites

- **Node.js ≥ 20**
- **PostgreSQL ≥ 14** (local install, Docker container, or hosted e.g. Neon / Railway)
- A **Clerk** account (free tier is fine for development)

### 1. Install dependencies

```bash
npm install
```

### 2. Provision services

| Service     | What to do                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| Postgres    | Create a development database.                                               |
| Clerk       | Create a **free dev application**, enable Email + Google as sign-in modes. |

### 3. Configure env vars

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Fill in the keys from each service. See comments in each `.env.example` for what each key is for.

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

This creates the core tables: `User`, `BusinessProfile`, `Membership`, `Customer`, `Worker`, `Job`, `Appointment`, `Call`.

### 5. Start the dev servers

In two terminals:

```bash
# Terminal 1 — backend (port 4000)
npm -w @flowfix/api run dev

# Terminal 2 — frontend (port 5173)
npm -w @flowfix/web run dev
```

Or both at once from the repo root:

```bash
npm run dev
```

Open <http://localhost:5173> to see the landing page. Sign-in / sign-up flows are wired through Clerk. The `/me` API endpoint on the backend verifies the Clerk session JWT.

### 6. Clerk webhooks (optional in dev)

To sync Clerk `user.created` events into your local `User` table:

1. Run `ngrok http 4000` to get a public URL.
2. In Clerk's dashboard, add a webhook endpoint pointing at `<ngrok-url>/webhooks/clerk`.
3. Subscribe to the `user.created`, `user.updated`, and `user.deleted` events.
4. Copy the Signing Secret into `CLERK_WEBHOOK_SIGNING_SECRET` in `apps/api/.env`.

Without this, web sign-in/sign-up still works — the `/me` route just verifies the Clerk JWT without writing a local row.

---

## Build order

| # | Milestone                                | Status          |
| - | ---------------------------------------- | --------------- |
| 1 | Project setup, authentication, database  | 🚧 In progress  |
| 2 | Customer management                      | ⬜ Not started  |
| 3 | Job management                           | ⬜ Not started  |
| 4 | Calendar and scheduling                  | ⬜ Not started  |
| 5 | AI receptionist (Twilio + Deepgram + Claude) | ⬜ Not started |
| 6 | Notifications (SMS + email)              | ⬜ Not started  |
| 7 | Dashboard and analytics                  | ⬜ Not started  |
| 8 | Performance optimisation                 | ⬜ Not started  |
| 9 | Security hardening                       | ⬜ Not started  |
| 10| Production deployment                   | ⬜ Not started  |

---

## Development method

For every feature, the same loop:

1. Plan implementation.
2. Implement feature.
3. Run application.
4. Test feature.
5. Try to break feature intentionally.
6. Fix bugs.
7. Refactor.
8. Run regression tests.
9. Measure performance.
10. Compare against requirements.
11. Repeat until all acceptance criteria + performance targets pass.

**Never stop after code compiles.** Only move to the next milestone when the current one passes.

---

## Repository

- GitHub: <https://github.com/1-ProCoder/Idea>
- Owner: `1-ProCoder`

---

⭐ Built for tradespeople who can't afford to miss a call.
