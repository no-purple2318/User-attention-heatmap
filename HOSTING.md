# Hosting Guide: Decoupled User Attention Heatmap Platform

## Frontend Web Dashboard (Next.js App Router) -> Vercel
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**:
  - `DATABASE_URL`: Connection string to PostgreSQL (Read Access).
  - `NEXT_PUBLIC_API_URL`: The deployed URL of the NestJS backend.

## Backend API Core (NestJS) -> Render
- **Platform**: Render.com Web Service
- **Environment**: Node.js
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `DATABASE_URL`: Read/write connection string for the PostgreSQL database.
  - `PORT`: Will be automatically assigned by Render (make sure your App listens to `process.env.PORT || 3001`).

## Database Engine (PostgreSQL)
- **Providers**: Supabase, Render Postgres, Neon, or Railway.
- Connect securely using Prisma `@prisma/adapter-pg`.

## Important Notes
- The Extension connects directly to the Backend API. Make sure `background.js` and `popup.js` point to the correct production domain of the NestJS API instead of `localhost:3001`.
- Update CORS inside the NestJS bootstrap (`main.ts`) to permit requests from the Extension and the Vercel Frontend.
