# Deploy Unfold on Render

One **Web Service** builds the React client and runs the Express API on the same URL (no separate frontend host).

## Quick steps

1. Push this repo to GitHub (if it is not already).
2. In [Render](https://render.com/) → **New** → **Blueprint** (or **Web Service** connected to the repo).
3. If using the Blueprint, Render reads [`render.yaml`](./render.yaml). Otherwise set:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
4. Add **Environment variables** (see below). Secrets marked `sync: false` in the blueprint must be set in the Render dashboard.
5. Deploy. Your app will be at `https://<service-name>.onrender.com`.

## Required environment variables

Set these in **Render → your service → Environment**:

| Variable | Description |
|----------|-------------|
| `TRITON_BASE_URL` | OpenAI-compatible API base URL |
| `TRITON_API_KEY` | API key for that endpoint |
| `TRITON_MODEL` | Model id (e.g. `gpt-oss-120b`) |
| `VITE_FIREBASE_API_KEY` | Firebase web config (needed at **build** time) |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |

Optional:

| Variable | Default |
|----------|---------|
| `ANALYZE_DAILY_LIMIT` | `25` |
| `CHAT_DAILY_LIMIT` | `80` |

Render sets `PORT` and `RENDER` automatically. `NODE_ENV=production` is set in `render.yaml`.

## Firebase after deploy

1. **Authentication → Settings → Authorized domains** — add your Render host, e.g. `unfold-xxxx.onrender.com` (no `https://`).
2. Deploy Firestore rules from your machine (one time):

   ```bash
   firebase deploy --only firestore:rules
   ```

3. If Google sign-in fails, confirm all `VITE_FIREBASE_*` values match the Firebase console and **redeploy** after changing them (Vite bakes them in at build time).

## Verify

- `https://<your-app>.onrender.com/api/health` → `{"ok":true,...}`
- Open the site root → sign in → upload a test PDF.

## Free tier notes

- Services on the free plan **spin down** after inactivity; the first request may take ~30s.
- In-memory rate limits reset when the instance restarts.

## Local production smoke test

```bash
npm install
npm run build
NODE_ENV=production npm start
# open http://localhost:8787
```
