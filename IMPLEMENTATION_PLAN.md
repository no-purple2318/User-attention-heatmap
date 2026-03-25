# Complete Blueprint: Decoupled User Attention Heatmap Platform

## 1. System Architecture Overview
The platform uses a decoupled microservices-style architecture composed of three interconnected parts:
1. **Frontend Web Dashboard**: A server-rendered Next.js (App Router) application that displays analytical playback and acts as the user-facing web portal on **Port 3000**.
2. **Backend API Core**: A standalone NestJS framework server utilizing the Prisma ORM to efficiently process thousands of concurrent tracking events and manage Database access on **Port 3001**.
3. **Chrome Extension Tracker**: A Vanilla JS extension (`manifest v3`) built to natively track real-time cursor movements, scroll distances, and mock eye-gazing directly from browser pages.
4. **Database Engine**: **PostgreSQL**, connected securely using `@prisma/adapter-pg` through a native Node connection `Pool`.

---

## 2. Directory & Root Structure
```text
/User_attention_heatmap/ (Project Root)
├── manifest.json
├── popup.html / popup.js / popup.css
├── background.js
├── content.js
├── gaze.js (WebGazer / facial tracking overlay script)
├── face_mesh.js
├── HOSTING.md (Dual-App Vercel/Render Hosting configuration guide)
│
├── dashboard/ (Next.js Application)
│   ├── .env (Stores Next.js specific DATABASE_URL locally)
│   ├── package.json (Includes next, react, lucide-react, simpleheat)
│   ├── prisma/ (Frontend read-only Prisma definitions)
│   │   └── schema.prisma
│   └── src/
│       ├── app/
│       │   ├── page.tsx (Landing page)
│       │   ├── login/ (Login view component)
│       │   ├── dashboard/ (Session list and navigation UI)
│       │   ├── replay/[id]/ (Canvas event replayer utilizing simpleheat)
│       │   │   ├── page.tsx (MUST EXPORT `dynamic="force-dynamic"` to foil caching)
│       │   │   └── Replayer.tsx
│       │   └── api/
│       │       └── auth/login/route.ts (Proxy route that fetches NestJS, then stamps `dashboard_user` HTTP cookie)
│       └── lib/
│           ├── auth.ts
│           └── prisma.ts
│
└── backend/ (NestJS API Core)
    ├── .env (Stores backend DATABASE_URL)
    ├── package.json (Includes @nestjs/core, @prisma/client, pg, @prisma/adapter-pg)
    ├── prisma/ 
    │   └── schema.prisma (Single source of truth Database configuration)
    └── src/
        ├── main.ts (Bootstrap file, forces Port 3001, CORS allows all `*`)
        ├── app.module.ts (Wires AuthModule, TrackModule, PrismaModule)
        ├── prisma/ (Global wrapper exposing strict `PrismaService` tied to PrismaPg)
        ├── auth/ (REST controller returning { message, user })
        └── track/ (REST controller exposing POST /track/session && POST /track/events)
```

---

## 3. The PostgreSQL Schema Models (`prisma/schema.prisma`)
The system expects `datasource db { provider = "postgresql" }`. 
It relies on a 3-table relational structure uniquely stringed by Native Unique IDs (no JWT generation overhead required).

1. **User Table**:
   - `id` (String UUID @id)
   - `email` (String @unique)
   - `passwordHash` (String)
   - `role` (String, default `"USER"`)
   - `sessions` (Relation to `Session[]`)
   - `createdAt` (DateTime)

2. **Session Table**:
   - `id` (String UUID @id)
   - `userId` (String, links back to User)
   - `url` (String, the webpage being recorded)
   - `startTime` (DateTime @default(now()))
   - `events` (Relation to `EventLog[]`)

3. **EventLog Table**:
   - `id` (String UUID @id)
   - `sessionId` (String, links back to Session)
   - `timestamp` (DateTime)
   - `type` (String, e.g., "mouse", "scroll", "eye")
   - `x` (Float, relative X coordinate)
   - `y` (Float, relative Y coordinate)

---

## 4. Specific Functional Logic Highlights

### **A. Extrinsic User ID Authentication (Direct Workflow)**
- Rather than forcing the NestJS backend to cryptographically sign, issue, and verify heavy **JWT (JSON Web Tokens)** upon every single tracking tick, we use a hyper-efficient direct injection scheme.
- When an extension user inputs an email into `popup.html`, `popup.js` fires a POST to `http://localhost:3001/auth/login`. 
- NestJS parses the Postgres user table and returns a base `{ user }` packet. 
- The Chrome Extension saves `user.id` rigidly into `chrome.storage.local`. 

### **B. Batched Event Ingestion (`background.js`)**
- Constantly dumping single mouse ticks directly into the database will crash any conventional server. In reality, `content.js` tracks raw DOM window updates constantly, pushing events sequentially via `chrome.runtime.sendMessage` back to `background.js`. 
- **The Buffer**: `background.js` caches these events in a volatile array variable. Every exactly **5000 milliseconds** (5 seconds), it flushes the batch `JSON.stringify({ userId, sessionId, events[] })` to the NextJS API `http://localhost:3001/track/events`. 

### **C. The Next.js Next-Gen Proxy (`dashboard/src/app/api/auth/login/route.ts`)**
- The Next.js server behaves as an exclusive middleware for Dashboard authentication.
- A user arriving at `localhost:3000/login` utilizes this internal `route.ts`. This route secretly requests `http://localhost:3001/auth/login` independently, evaluates the payload, and then issues its native Next.js `"dashboard_user"` secured HTTP-only cookie to the user's browser environment. 
- This guarantees NextJS Server Components (like fetching user-specific heatmap lists in `dashboard/page.tsx`) correctly interpret context natively, without ever breaking away from NestJS logic. 

### **D. Replayer Canvas Rendering**
- `src/app/replay/[id]/Replayer.tsx` is the sole consumer of the `simpleheat` graphic library. Because simpleheat lacks native TypeScript types, the `import simpleheat` directive requires a trailing `// @ts-expect-error simpleheat lacks types` comment explicitly.
- In playback, the system leverages `useEffect` timers dynamically pulling offset differences tied natively to the original `eventLog.timestamp` intervals captured by Prisma PostgreSQL to recreate an authentic visual replay!
