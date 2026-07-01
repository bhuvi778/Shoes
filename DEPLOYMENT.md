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

`MONGODB_URI` is optional. If it is empty, the backend uses the seed product data.

## 2. Deploy frontend on Vercel

You can import the repo root directly. The root `vercel.json` builds `frontend`.

Vercel environment variables:

- `VITE_API_URL=https://your-render-service.onrender.com`

After the Vercel URL is created, put that full URL into Render's `CLIENT_URLS` value and redeploy/restart the Render service.

## 3. Smoke tests

Backend:

```bash
curl https://your-render-service.onrender.com/api/health
```

Frontend:

Open the Vercel URL and confirm products load from the Render API.
