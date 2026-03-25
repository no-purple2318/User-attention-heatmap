# User Attention Heatmap - Fullstack Hosting Guide

This project utilizes a **decoupled architecture**, meaning the Frontend (Next.js) and the Backend API (NestJS) are separate applications that must be deployed independently.

## 1. Database Setup (PostgreSQL)
We use a real PostgreSQL database with connection pooling for maximum performance.
1. Sign up for a free managed PostgreSQL provider like [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Grab your connection string (e.g. `postgresql://user:password@host/db`).
3. Inside your local `backend/.env` file, add:
   ```env
   DATABASE_URL="postgresql://user:password@host/db"
   ```
4. From the `/backend` folder, sync the database by running: `npx prisma db push`.

## 2. Deploying the Backend (NestJS)
NestJS is persistent and should be hosted on a container-based platform. We recommend **Render** or **Railway**.

### Using Render:
1. Push your repository to GitHub.
2. Go to [Render](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to: `npm install && npx prisma generate && npm run build`
6. Set the **Start Command** to: `npm run start:prod`
7. In the **Environment Variables**, add only your `DATABASE_URL`.
8. Once deployed, Render will provide a URL like `https://heatmap-api.onrender.com`. Keep this URL handy.

## 3. Deploying the Frontend (Next.js)
The optimal host for Next.js is **Vercel**.

1. Go to [Vercel](https://vercel.com) and import the exact same GitHub repository.
2. Set the **Root Directory** to `dashboard`.
3. In the Vercel dashboard for this project, edit the `src/app/api/auth/login/route.ts` file (or set an environment variable if you abstract it) so the `fetch()` request points to your *Render Backend URL* instead of `http://localhost:3001`.
4. Deploy the project. Vercel will build your React application seamlessly.

## 4. Extension Configuration
Finally, update your Chrome extension to send data strictly to your new, real NestJS backend.
In both `popup.js` and `background.js`, update the `API_BASE`:
```javascript
// Change this to your deployed Render URL:
const API_BASE = "https://heatmap-api.onrender.com";
```
Reload the extension in Chrome, and data will flow seamlessly from the user's browser, safely through your NestJS endpoints, into your PostgreSQL database, and visibly onto your Next.js dashboard!
