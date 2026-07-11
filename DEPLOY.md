# FlowFix AI — Production Deploy

End-to-end deploy for the live stack: **Railway** (Express API + Postgres), **Vercel** (Vite-built React SPA), **Clerk** (auth + webhook). Follow the steps in order — the API URL is needed before Vercel and Clerk can be wired up.

---

## 0. Prerequisites

- GitHub admin on the [`1-ProCoder/Idea`](https://github.com/1-ProCoder/Idea) repo.
- A [Clerk](https://dashboard.clerk.com) account (free tier is fine for development).
- A [Railway](https://railway.app) account.
- A [Vercel](https://vercel.com) account.

Have these three values ready from your Clerk dashboard (User & Authentication → API Keys):

| Variable | Prefix | Where it goes |
| --- | --- | --- |
| **VITE_CLERK_PUBLISHABLE_KEY** | `pk_test_…` (dev) or `pk_live_…` (prod) | Vercel env var |
| **CLERK_SECRET_KEY** | `sk_test_…` or `sk_live_…` | Railway env var |
| **CLERK_WEBHOOK_SIGNING_SECRET** | `whsec_…` (generated in step 5) | Railway env var |

> Clerk's publishable key is **safe to expose** in a public JS bundle — that's its purpose. **Never** put the secret key or webhook signing secret into anything that ships to the browser.

---

## 1. Deploy the API + Postgres on Railway

1.1. Sign in to Railway → **New Project** → **Deploy from GitHub Repo** → choose `1-ProCoder/Idea`.

1.2. Inside the new project, click **+ New** → **Database** → **PostgreSQL**. The plugin provisions automatically and exposes `DATABASE_URL` to other services in the same project.

1.3. Click **+ New** → **GitHub Repo** → choose `1-ProCoder/Idea` again. Name it `flowfix-api`. Railway uses the `Dockerfile` at the repo root and starts building.

1.4. Open the **Variables** tab on `flowfix-api` and add:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | **Add Reference** → pick the Postgres service's `DATABASE_URL` |
   | `CLERK_SECRET_KEY` | paste from Clerk dashboard |
   | `WEB_ORIGIN` | placeholder for now (e.g. `https://flowfix.example.com`) — you'll set the real URL in step 3 |
   | `CLERK_WEBHOOK_SIGNING_SECRET` | leave unset for now; set in step 5 |

1.5. The first deploy runs:
   1. `npm ci` at the repo root (workspaces resolve).
   2. `npx prisma generate` inside `apps/api/`.
   3. `tsc` → emits `apps/api/dist/index.js`.
   4. Railway's `releaseCommand` runs `npx prisma migrate deploy`.
   5. `startCommand` runs `node dist/index.js`.

1.6. **Settings** → **Networking** → **Generate Domain**. Copy the `*.up.railway.app` URL. **This is your `RAILWAY_API_URL`** — example: `https://flowfix-api.up.railway.app`.

1.7. Verify the API is alive:

   ```bash
   curl https://flowfix-api.up.railway.app/api/health
   # → {"status":"ok","uptime":42.1,"timestamp":"…"}
   ```

   The `/api/health` endpoint is mounted **before** `clerkMiddleware`, so it works without auth.

---

## 2. Deploy the frontend on Vercel

2.1. Sign in to Vercel → **Add New** → **Project** → import `1-ProCoder/Idea`.

2.2. **Root Directory**: leave as `.` (repo root). Vercel reads `vercel.json` for build settings. **Do not change this to `apps/web/`.** The `buildCommand` starts with `npm install`, which must run at the repo root to resolve the workspace packages (`@flowfix/shared`, etc.). If Vercel's Root Directory is `apps/web/`, the install only sees `apps/web/`'s deps and the build fails with `Cannot find module '@flowfix/shared'`.

2.3. **Framework Preset**: choose **Other**. The `framework: null` field in `vercel.json` disables Vite auto-detection — we drive builds explicitly.

2.4. **Environment Variables**:
   - `VITE_CLERK_PUBLISHABLE_KEY` → paste from Clerk dashboard.

2.5. **Build & Deployment Settings**: leave defaults (Vercel reads `buildCommand`/`outputDirectory` from `vercel.json`).

2.6. Click **Deploy**. Vercel runs `npm install && npm -w @flowfix/web run build`. The web app's build script chains a `postbuild` step (`apps/web/scripts/postbuild.mjs`, gated by `VERCEL=1`) that copies `apps/web/dist/` to `<repo>/dist/`, so Vercel's `outputDirectory: "dist"` (resolved at the repo root) can find it. The deploy then publishes the contents of `<repo>/dist/`.

2.7. After the deploy succeeds, copy your **Vercel URL** — example: `https://flowfix-ai.vercel.app`. **This is your `VERCEL_FRONTEND_URL`**.

2.8. **Critical follow-up**: the live `vercel.json` at HEAD has a **placeholder** for the API URL. Edit it in the repo:

   ```diff
   -  { "source": "/api/(.*)", "destination": "https://FLOWFIX_API_PROD_URL/api/$1" },
   +  { "source": "/api/(.*)", "destination": "https://flowfix-api.up.railway.app/api/$1" },
   ```

   Commit + push. Vercel auto-redeploys on the next push to `main`.

---

## 3. Wire API CORS back to the frontend

3.1. In **Railway → `flowfix-api` → Variables**, update `WEB_ORIGIN` from the placeholder to your real `VERCEL_FRONTEND_URL` (e.g. `https://flowfix-ai.vercel.app`).

3.2. Railway redeploys the API automatically with the new env var.

3.3. Verify CORS by opening your `VERCEL_FRONTEND_URL` in a browser and pressing F12 → Console → run:

   ```js
   fetch('https://flowfix-api.up.railway.app/api/health').then(r => r.json()).then(console.log)
   ```

   You should see `200 OK` and `{ status: "ok", … }`.

---

## 4. Configure Clerk's allowed origins + redirect URLs

4.1. **Clerk Dashboard** → **User & Authentication** → **Social Connections**: enable at least **Email** + **Google** for development.

4.2. **Clerk Dashboard** → **Domains** (or **Account** → **Ports & Domains**, depending on plan):
   - Add `https://flowfix-ai.vercel.app` to the **allowed origins** for sign-in/sign-up.
   - For Clerk's hosted sign-in pages, the **redirect URLs** are automatic for verified domains — no manual config needed unless you're using a custom domain.

---

## 5. Set up the Clerk webhook (optional but recommended)

Without this, signing in works but the API doesn't persist a local `User` row. With it, `user.created`, `user.updated`, and `user.deleted` events from Clerk sync into Postgres.

5.1. **Clerk Dashboard** → **Webhooks** → **Add Endpoint**.

5.2. **Endpoint URL**: `https://flowfix-api.up.railway.app/webhooks/clerk`.

5.3. **Subscribe to events**: `user.created`, `user.updated`, `user.deleted`.

5.4. Click **Create**. Clerk shows a **Signing Secret** (starts with `whsec_`).

5.5. Railway → `flowfix-api` → Variables → set `CLERK_WEBHOOK_SIGNING_SECRET` to that value. Railway redeploys.

5.6. Verify by signing up a new test user. Hit `https://flowfix-api.up.railway.app/api/me` from the browser while signed in — you should get `200 OK`. To confirm the webhook wrote the row, run `railway run npx prisma studio` from a local checkout of the repo and check the **User** table.

---

## 6. Smoke test the full flow

6.1. Open `https://flowfix-ai.vercel.app` in a fresh browser window.

6.2. Click **Sign up** → enter a real-looking email + password → confirm the Clerk modal opens, validates the email, and creates the account.

6.3. After sign-up, you should be redirected to `/dashboard` (or `/sign-in` if you closed the modal and re-opened it).

6.4. `/dashboard` should render with **empty cards** + the EmptyState panel — that's correct for a brand-new account. Same for `/calls`, `/technicians`, `/schedule`.

6.5. Optional: seed starter data via `railway run npm -w @flowfix/api run prisma:seed` so the dashboard has rows to show.

6.6. Optional: set a custom domain in Vercel & Railway (both support custom CNAMEs), then update the Vercel + Clerk allowed origins + Railway `WEB_ORIGIN` env var accordingly.

---

## 7. Troubleshooting

### API deploy fails with `Cannot find module '@flowfix/shared'`

The shared package is consumed as source `.ts` (no build step), and Node 20 can't import `.ts` files by default. Two fixes:

1. **Quick fix**: run the API under Node 22+ with `--experimental-strip-types` (or `NODE_OPTIONS=--experimental-strip-types` in the Railway env vars).
2. **Proper fix**: add a `build` script to `packages/shared/package.json` that emits `dist/`, then update its `main`/`exports` to point at `./dist/index.js`. Rebuild and redeploy.

### Vercel build hangs or errors

Run the build locally:

```bash
cd <repo root>
npm -w @flowfix/web run build
```

Read the output. Common issues: missing `VITE_CLERK_PUBLISHABLE_KEY`, Node version mismatch, type errors from `tsc -b` upstream of `vite build`.

### `/api/*` calls return a 404 page (HTML)

The Vercel rewrite isn't firing — usually because `vercel.json` still has the `FLOWFIX_API_PROD_URL` placeholder. Replace it with the real Railway URL, commit, push.

### API health returns `503 database_unavailable`

The API is up but can't reach Postgres. In **Railway → Postgres → Variables**, copy `DATABASE_URL` into the **API service's** Variables tab. Confirm both services are in the same project.

### Sign-up modal shows Clerk errors

The Clerk publishable key in `VITE_CLERK_PUBLISHABLE_KEY` on Vercel doesn't match the Clerk instance. Re-paste from **Clerk Dashboard → API Keys**.

### Webhook returns `400 invalid_signature`

The `CLERK_WEBHOOK_SIGNING_SECRET` on Railway is wrong. Re-copy from **Clerk Dashboard → Webhooks → your endpoint → Signing Secret**.

---

### Vercel build error: "No Output Directory named 'dist' found"

Vercel resolves `outputDirectory` at the **repo root** (the directory containing `vercel.json`), not at the Vite/React project's actual location. Vite, when launched via `npm -w @flowfix/web run build`, runs with cwd `apps/web/` and writes its build output to `apps/web/dist/`. The default `dist/` at the repo root doesn't exist, so Vercel fails to find it.

The fix is split across two files:

- `vercel.json` sets `outputDirectory: "dist"` (resolved at the repo root).
- `apps/web/scripts/postbuild.mjs` copies `apps/web/dist/` to `<repo>/dist/`. It's chained onto the web app's `build` script in `apps/web/package.json` and gated by `VERCEL=1` so local builds are unaffected.

If you fork or branch and the Vercel deploy breaks again, check both files are intact and that the `VERCEL` env var is set in your Vercel project (it is by default for all Vercel builds).

---

## 8. What this deploys (recap)

| Layer       | Host        | What it does                                  | Public URL                              |
| ----------- | ----------- | --------------------------------------------- | --------------------------------------- |
| Frontend    | Vercel      | Vite-built React SPA + BrowserRouter          | `https://flowfix-ai.vercel.app`         |
| Backend API | Railway     | Express + Prisma + Clerk middleware           | `https://flowfix-api.up.railway.app`    |
| Database    | Railway PG  | Postgres 15+ (plugin)                         | private, accessible via `DATABASE_URL`  |
| Auth        | Clerk       | Hosted sign-in/sign-up, sessions, webhooks    | managed by Clerk                        |

After this is live, you've finished **Milestone 10** of the build order (see [`README.md`](./README.md)).

For ongoing changes: commit + push to `main`. Vercel auto-deploys the frontend. Railway auto-deploys the API.
