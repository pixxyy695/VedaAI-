# Free Deployment Guide

This setup keeps backend hosting at `0` platform cost for a hiring/demo link:

- Frontend: Vercel Hobby
- Backend API + WebSocket + BullMQ worker: one Render Free web service
- Redis/job state: one Render Free Key Value instance
- Database: MongoDB Atlas free cluster
- AI: OpenAI API, usage billed to your OpenAI account

## Important Trade-Off

The app still uses BullMQ and Redis, but the hosted free deployment runs the worker inside the API process with `RUN_WORKER_IN_API=true`. That avoids Render's paid background-worker service. For a production system, split the worker back out with `npm --workspace @vedai/api run start:worker`.

Render Free services can spin down, and Free Key Value is in-memory only. That is fine for job state because MongoDB stores the durable users, assignment inputs, and generated papers.

## 1. MongoDB Atlas

Create a free MongoDB Atlas cluster and copy the connection string.

```txt
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/vedai?retryWrites=true&w=majority
```

## 2. Render Backend

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Render reads `render.yaml` and creates:
   - `vedai-api` as a Free web service
   - `vedai-redis` as a Free Key Value instance
4. Fill the required secret values:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`
   - `WEB_ORIGIN` temporarily as `http://localhost:3000`
5. Deploy and copy the API URL:

```txt
https://vedai-api.onrender.com
```

## 3. Vercel Frontend

Import the same GitHub repo into Vercel. Use the repository root as the project root.

Set these environment variables:

```txt
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_API_URL/api
NEXT_PUBLIC_WS_URL=wss://YOUR_RENDER_API_URL/ws
```

Deploy and copy the Vercel URL.

## 4. Finish CORS

Return to Render and set:

```txt
WEB_ORIGIN=https://your-vercel-app.vercel.app
```

Redeploy `vedai-api`.

## 5. Smoke Test

1. Open the Vercel URL.
2. Create a teacher account.
3. Generate an assessment.
4. Reload and sign back in.
5. Confirm the paper remains under **My Assessments**.

## Zero-Cost Checklist

- Render `vedai-api`: Free instance
- Render `vedai-redis`: Free Key Value
- Vercel: Hobby plan
- MongoDB Atlas: free cluster
- No Render worker service
- OpenAI key is the only usage-billed part
