# Deploying Plant Guardians to Render

## Quick Start (Blueprint Deploy)

1. Push this repo to GitHub
2. In the Render dashboard, click **New → Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` and creates all 3 services
4. After the initial deploy finishes, set two env vars manually (see below)
5. Rebuild both services to pick up the new values

## Post-Deploy: Set Environment Variables

### Backend (plant-guardians-api) → Environment tab

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | Your frontend URL, e.g. `https://plant-guardians.onrender.com` |
| `GEMINI_API_KEY` | Your Google Gemini API key (optional — AI features degrade gracefully without it) |

Then click **Manual Deploy → Deploy latest commit**.

### Frontend (plant-guardians) → Environment tab

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Your backend URL + `/api/v1`, e.g. `https://plant-guardians-api.onrender.com/api/v1` |

Then click **Manual Deploy → Deploy latest commit** (this is a build-time variable, so a rebuild is required).

## Verify

```bash
# Backend health check
curl https://plant-guardians-api.onrender.com/api/health

# Visit the app
open https://plant-guardians.onrender.com
```

## Free Tier Notes

- **Cold starts:** The backend spins down after 15 min of inactivity. First request after idle takes ~30-60s.
- **Database expiry:** Free PostgreSQL expires after 90 days. Recreate or upgrade when prompted.
- **Ephemeral disk:** Uploaded plant photos are lost on redeploy. For persistence, upgrade to a paid plan with a persistent disk or integrate cloud storage (S3, Cloudflare R2).

## Custom Domain (Optional)

1. Purchase a domain
2. In Render → your service → Settings → Custom Domains → add it
3. Follow Render's DNS instructions (CNAME record)
4. Update `FRONTEND_URL` on the backend and `VITE_API_BASE_URL` on the frontend to use the new domain
5. Rebuild both services
