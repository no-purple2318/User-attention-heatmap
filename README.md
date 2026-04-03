# User Attention Heatmap Platform

## Prerequisites
1. **Node.js** v18+
2. **PostgreSQL** / **Supabase** Database

## Architecture
1. **Chrome Extension**: Injects decoupled scripts into active websites, securely validating tracking logic before polling and pushing mouse/scroll/gaze parameters onto the NestJS API.
2. **NestJS Backend (`/backend`)**: Handles heavily trafficked ingestion logic by using batch buffering (saving rows onto your database seamlessly without choking HTTP paths). Also houses JWT Authentication logic encoded via Bcrypt.
3. **Next.js Dashboard (`/dashboard`)**: SSR application utilizing App Router to map your PostgreSQL data directly into visually rich web pages.

## Getting Started

### 1. Launch the Ingestion API
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
The NestJS server will start on `http://localhost:3001`

### 2. Launch the Dashboard
```bash
cd dashboard
npm install
npm run dev
```
The application will launch on `http://localhost:3000`. 
Note: Before testing the local frontend, use the Chrome extension to create an account inside your database manually.

### 3. Load the Extension
- Visit `chrome://extensions`
- Enable "Developer Mode"
- Click "Load Unpacked" and highlight this root directory.
