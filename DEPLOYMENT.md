# Deployment

This project is configured for a Vercel frontend and a Render backend.

## 1. Deploy backend on Render

Create a new Render Blueprint from this repo. Render will read `render.yaml`.

Backend settings:

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`

Render environment variables:

- `NODE_ENV=production`
- `CLIENT_URLS=https://your-vercel-domain.vercel.app`
- `MONGODB_URI=your_mongodb_connection_string`
- `ADMIN_EMAIL=admin@qadam.store`
- `ADMIN_PASSWORD=choose_a_strong_password`
- `ADMIN_TOKEN_SECRET=choose_a_long_random_secret`

`MONGODB_URI` is optional. If it is empty, the backend uses the seed product data.
Admin updates require MongoDB. In MongoDB Atlas, allow Render's outbound IP or temporarily allow `0.0.0.0/0` in Network Access; otherwise `/api/health` will show `database: "seed-data"` and admin login will be disabled.

## 2. Deploy frontend on Vercel

You can import the repo root directly. The root `vercel.json` builds `frontend`.

Vercel environment variables:

- `VITE_API_URL=https://shoes-3ez9.onrender.com`

After the Vercel URL is created, put that full URL into Render's `CLIENT_URLS` value and redeploy/restart the Render service.
The backend also allows `.vercel.app` domains by default through `CLIENT_URL_SUFFIXES`.

## 3. Smoke tests

Backend:

```bash
curl https://your-render-service.onrender.com/api/health
```

Frontend:

Open the Vercel URL and confirm products load from the Render API.

## Admin

Open the frontend and click `Admin` in the navbar. The default local/demo login is:

- Email: `admin@qadam.store`
- Password: `Qadam@2026`

Change `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` in Render before using the site publicly.
