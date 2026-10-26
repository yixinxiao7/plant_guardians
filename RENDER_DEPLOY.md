# Deploying Plant Guardians to Render

## Prerequisites

- A [Render](https://render.com) account
- A [Supabase](https://supabase.com) account (free plan) — hosts the PostgreSQL database
- This repo pushed to GitHub
- A Google Gemini API key (from [Google AI Studio](https://makersuite.google.com/app/apikey)) — optional, AI features will gracefully degrade without it

## Option A: One-Click Deploy (Recommended)

1. Create the Supabase project and copy its session-pooler URI (see [Step 1](#step-1-create-supabase-database) below), then push this branch to GitHub
2. Go to [https://render.com/deploy](https://render.com/deploy)
3. Connect your GitHub repo — Render will detect `render.yaml` automatically
4. Render creates 2 resources: backend web service, frontend static site (the database lives on Supabase)
5. **After deploy, set these env vars manually** (marked `sync: false` in render.yaml):

### Backend service → Environment tab:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase session-pooler URI (port 5432) from Step 1 |
| `FRONTEND_URL` | Your frontend's URL, e.g. `https://plant-guardians.onrender.com` |
| `GEMINI_API_KEY` | Your Google Gemini API key (optional) |

### Frontend static site → Environment tab:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Your backend's URL + `/api/v1`, e.g. `https://plant-guardians-api.onrender.com/api/v1` |

6. **Trigger a rebuild** of the frontend after setting `VITE_API_BASE_URL` (it's a build-time variable)
7. **Trigger a redeploy** of the backend after setting `DATABASE_URL`, `FRONTEND_URL` and `GEMINI_API_KEY` (the build runs `npm run migrate`, which creates the schema on Supabase)

## Option B: Manual Setup

### Step 1: Create Supabase Database

1. Supabase Dashboard → New project
2. Name: `plant-guardians`
3. Plan: Free
4. Region: `us-east-1` (N. Virginia), closest to the Render Ohio backend
5. Set a database password and click Create new project
6. Click **Connect** and copy the **Session pooler** URI (port 5432). Render egress is IPv4 and the direct connection is IPv6-only on the free plan, so use the pooler, not the direct connection string
7. Settings → API: remove `public` from the exposed schemas. The tables have no row-level security and the app only reaches Postgres server-side, so the Data API should not expose them

### Step 2: Create Backend Web Service

1. Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name:** `plant-guardians-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run migrate`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Add environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `RENDER` | `true` |
| `DATABASE_URL` | (paste the Supabase session-pooler URI from Step 1) |
| `JWT_SECRET` | (generate: `openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7` |
| `FRONTEND_URL` | (set after frontend deploys — e.g., `https://plant-guardians.onrender.com`) |
| `GEMINI_API_KEY` | (your Google Gemini key, optional) |
| `MAX_UPLOAD_SIZE_MB` | `5` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |
| `AUTH_RATE_LIMIT_MAX` | `20` |

5. Under Advanced → Health Check Path: `/api/health`
6. Click Create Web Service

### Step 3: Create Frontend Static Site

1. Render Dashboard → New → Static Site
2. Connect same GitHub repo
3. Configure:
   - **Name:** `plant-guardians`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://plant-guardians-api.onrender.com/api/v1` (use your actual backend URL) |

5. Under Redirects/Rewrites, add a catch-all rewrite:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
6. Click Create Static Site

### Step 4: Wire Up FRONTEND_URL

1. Go back to the **backend** service → Environment tab
2. Set `FRONTEND_URL` to the frontend's live URL (e.g., `https://plant-guardians.onrender.com`)
3. Click Save Changes — this triggers a redeploy

## Verify Deployment

Once both services are live:

```bash
# Health check
curl https://plant-guardians-api.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Visit the frontend
open https://plant-guardians.onrender.com
```

## Important Notes

### Free Tier Limitations
- **Backend spins down after 15 minutes of inactivity.** First request after idle takes ~30-60 seconds (cold start). This is normal on Render's free tier.
- **Supabase free projects pause after 7 days without database activity.** `/api/health` runs `SELECT 1`, and the `keepalive` GitHub Actions workflow (`.github/workflows/keepalive.yml`) calls it every 2 days. GitHub disables scheduled workflows after 60 days with no repo activity, so re-enable it from the Actions tab if Supabase emails a pause warning.
- **No automatic backups on Supabase free.** Run a manual `pg_dump` over the session pooler before risky migrations.
- **File uploads are ephemeral.** Render's free tier uses an ephemeral filesystem — uploaded plant photos will be lost on redeploy. For persistent uploads, consider upgrading to a paid plan with a persistent disk, or integrating a cloud storage service (S3, Cloudflare R2, etc.).

### Custom Domain (Optional)
1. Purchase a domain (e.g., from Namecheap, Cloudflare, Google Domains)
2. In Render, go to your frontend static site → Settings → Custom Domains
3. Add your domain and follow Render's DNS instructions
4. Repeat for the backend if you want a subdomain like `api.yourdomain.com`
5. Update `FRONTEND_URL` on the backend and `VITE_API_BASE_URL` on the frontend accordingly
6. Rebuild both services

### Security Notes
- `JWT_SECRET` is auto-generated by Render when using the blueprint (render.yaml). For manual setup, generate a strong secret.
- CORS is configured to only allow requests from the `FRONTEND_URL` origin.
- Cookies use `sameSite: 'none'` on Render (detected automatically via `RENDER=true` env var) to support cross-origin auth between the frontend and backend subdomains.
- All cookies are `secure: true` and `httpOnly: true`.
