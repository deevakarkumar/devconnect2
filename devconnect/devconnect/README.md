# DevConnect — Developer Networking & Portfolio Platform

> A full-stack developer networking platform where developers create profiles, showcase projects, write technical blog posts, connect with peers, and endorse skills in real time.

---

## 📋 Table of Contents
1. [Tech Stack & Architecture](#-tech-stack--architecture)
2. [Monorepo Structure](#-monorepo-structure)
3. [Database Schema (ER Diagram)](#-database-schema-er-diagram)
4. [User Flow Diagrams](#-user-flow-diagrams)
5. [API Endpoint Documentation](#-api-endpoint-documentation)
6. [Real-Time Socket.io Events](#-real-time-socketio-events)
7. [Local Setup & Development](#-local-setup--development)
8. [Testing & Quality Assurance](#-testing--quality-assurance)
9. [Deployment Guide](#-deployment-guide)
10. [7-Minute Live Demo Script](#-7-minute-live-demo-script)

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS | Single Page App (SPA) & PWA with custom glassmorphism design system |
| **Backend** | Node.js, Express.js (TypeScript) | RESTful API server with strict TypeScript typing and Zod validation |
| **Database** | PostgreSQL (Neon Cloud) | Relational database managed with Prisma ORM |
| **Auth** | JWT in `httpOnly` cookie + OAuth 2.0 | Secure session handling + GitHub OAuth login |
| **File Storage** | Cloudinary API | Cloud storage for compressed developer avatar images (max 2MB) |
| **Real-time** | Socket.io | Room-based real-time push notifications for connections & endorsements |
| **State Mgmt** | TanStack React Query + Zustand | Server-state caching and synchronization + lightweight client UI state |
| **Testing** | Vitest (Client) + Jest (Server) | Unit testing and HTTP integration test suites |

---

## 📁 Monorepo Structure

```
devconnect/
├── client/                     # Frontend SPA & PWA (React 19 + Vite)
│   ├── public/                 # Favicons and PWA manifest icons
│   ├── src/
│   │   ├── pages/              # Auth, Dashboard, Profile, Blog, Search, Network
│   │   ├── App.tsx             # Shell layout, navbar, notification popover, toasts
│   │   ├── api.ts              # Type-safe API client wrapper with standardized envelopes
│   │   ├── store.ts            # Zustand store for toasts and UI state
│   │   └── index.css           # Glassmorphism tokens, gradients, and custom scrollbars
│   ├── vite.config.ts          # Vite & Vitest configuration with PWA plugin
│   └── README.md
├── server/                     # Backend API & Real-time WebSockets
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (User, Project, Skill, Connection, etc.)
│   │   └── seed.ts             # Database seeder with sample profiles, skills, and articles
│   ├── src/
│   │   ├── routes/             # auth.ts, users.ts, social.ts, blog.ts
│   │   ├── app.ts              # Express configuration & security middleware
│   │   ├── index.ts            # Server entrypoint with Socket.io bootstrap
│   │   ├── lib.ts              # Prisma client, auth middlewares, response envelopes
│   │   └── health.test.ts      # Supertest API health and auth protection tests
│   └── README.md
└── shared/                     # Shared TypeScript interfaces & models
    ├── src/index.ts            # Shared API response envelope & entity definitions
    └── README.md
```

---

## 🗄️ Database Schema (ER Diagram)

```mermaid
erDiagram
    User ||--o{ Project : showcases
    User ||--o{ BlogPost : writes
    User ||--o{ Skill : possesses
    User ||--o{ Endorsement : gives
    Skill ||--o{ Endorsement : receives
    User ||--o{ Connection : requests
    User ||--o{ Connection : receives
    User ||--o{ Notification : receives

    User {
        String id PK
        String email UK
        String username UK
        String passwordHash
        String githubId UK
        String name
        String bio
        String location
        String avatarUrl
        DateTime createdAt
    }

    Project {
        String id PK
        String title
        String description
        String[] techStack
        String liveUrl
        String repoUrl
        String userId FK
        DateTime createdAt
    }

    BlogPost {
        String id PK
        String title
        String content
        Int views
        String authorId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Skill {
        String id PK
        String name
        String userId FK
    }

    Endorsement {
        String id PK
        String skillId FK
        String endorserId FK
    }

    Connection {
        String id PK
        String requesterId FK
        String receiverId FK
        String status
        DateTime createdAt
    }

    Notification {
        String id PK
        String userId FK
        String type
        String message
        Boolean read
        DateTime createdAt
    }
```

---

## 🔄 User Flow Diagrams

### 1. User Registration & Authentication Flow
```mermaid
sequenceDiagram
    actor Developer
    participant Client as React Client
    participant Server as Express API
    participant DB as Neon PostgreSQL

    Developer->>Client: Enters Name, Username, Email, Password
    Client->>Server: POST /api/auth/register
    Server->>DB: Check email / username availability
    Server->>DB: Hash password with bcrypt & create User
    Server->>Client: Set httpOnly JWT cookie & return user object
    Client->>Developer: Redirect to /dashboard
```

### 2. Peer Connection & Real-Time Notification Flow
```mermaid
sequenceDiagram
    actor DevA as Developer A
    actor DevB as Developer B
    participant ClientA as Dev A Client
    participant Server as Express + Socket.io
    participant DB as Neon PostgreSQL
    participant ClientB as Dev B Client

    DevA->>ClientA: Clicks "+ Connect" on Dev B profile
    ClientA->>Server: POST /api/connections/:devBId
    Server->>DB: Create Connection (status: PENDING)
    Server->>DB: Create Notification for Dev B
    Server-->>ClientB: Socket.io emit ('notification', { message: "Dev A sent request" })
    ClientB->>DevB: Displays real-time toast alert & updates bell badge
    DevB->>ClientB: Navigates to /network & clicks "Accept"
    ClientB->>Server: PATCH /api/connections/:id { action: "accept" }
    Server->>DB: Update Connection (status: ACCEPTED)
    Server-->>ClientA: Socket.io emit ('notification', { message: "Dev B accepted request" })
```

### 3. Skill Endorsement Flow
```mermaid
sequenceDiagram
    actor DevB as Connected Peer
    participant ClientB as Peer Client
    participant Server as Express API
    participant DB as Neon PostgreSQL

    DevB->>ClientB: Visits Dev A Profile (/u/alexrivera)
    ClientB->>Server: GET /api/users/alexrivera
    Server->>DB: Verify mutual connection status
    Server->>ClientB: Returns profile with connected: true
    DevB->>ClientB: Clicks "+1" on "TypeScript" skill
    ClientB->>Server: POST /api/endorse/:skillId
    Server->>DB: Check connection & uniqueness
    Server->>DB: Insert Endorsement record
    Server-->>DevB: Returns 201 Endorsed
    Server-->>ClientB: Socket.io sends notification to Dev A
```

---

## 📡 API Endpoint Documentation

All endpoints return a uniform envelope structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create account with email, password, username, name.
- `POST /api/auth/login` — Sign in and receive `httpOnly` JWT cookie.
- `POST /api/auth/logout` — Clear auth cookie.
- `GET /api/auth/me` — Retrieve current authenticated user session.
- `GET /api/auth/github` — Initiate GitHub OAuth 2.0 flow.
- `GET /api/auth/github/callback` — OAuth callback endpoint exchanging code for token.

### Developer Discovery & Profiles (`/api/users`)
- `GET /api/users?q=&skill=&location=&page=` — Paginated search with multi-filter query.
- `GET /api/users/:username` — Public profile with skills, endorsements, projects, and connection state.
- `PUT /api/users/me` — Update current user's name, bio, and location.
- `POST /api/users/me/avatar` — Upload and optimize avatar to Cloudinary (multipart/form-data, max 2MB).
- `POST /api/users/me/skills` — Add new skill.
- `DELETE /api/users/me/skills/:id` — Delete skill.
- `POST /api/users/me/projects` — Create project showcase entry.
- `PUT /api/users/me/projects/:id` — Update project entry.
- `DELETE /api/users/me/projects/:id` — Delete project entry.

### Connections & Social (`/api/connections`, `/api/endorse`, `/api/dashboard`)
- `GET /api/connections` — List accepted connections, incoming requests, and outgoing requests.
- `POST /api/connections/:userId` — Send connection request.
- `PATCH /api/connections/:id` — Accept (`action: 'accept'`) or reject (`action: 'reject'`) request.
- `DELETE /api/connections/:id` — Remove existing connection.
- `POST /api/endorse/:skillId` — Endorse a connected developer's skill.
- `DELETE /api/endorse/:skillId` — Remove endorsement.
- `GET /api/dashboard` — Aggregated stats (connections, posts, endorsements), activity feed, trending posts, and connection suggestions.

### Technical Blog (`/api/posts`)
- `GET /api/posts?author=&page=` — List articles with pagination and author filter.
- `GET /api/posts/:id` — Retrieve post by ID (automatically increments view counter).
- `POST /api/posts` — Publish new Markdown post.
- `PUT /api/posts/:id` — Update existing post (author only).
- `DELETE /api/posts/:id` — Delete post (author only).

---

## ⚡ Real-Time Socket.io Events

- **Connection**: `io.connect(SERVER_URL, { withCredentials: true })`
- **Room Joining**: Automatically joins personal room `user:{userId}` on authenticated handshake.
- **Outbound Server Event**:
  - `notification`: Dispatched whenever a peer sends a connection request or endorses a skill.

---

## 🚀 Local Setup & Development

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- PostgreSQL database URL (Neon, Supabase, or local Postgres)
- Free Cloudinary credentials (cloud name, API key, secret)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/devconnect.git
cd devconnect
npm install
```

### 2. Configure Environment Variables
In `server/.env`:
```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
JWT_SECRET=your-super-secret-random-jwt-key
CLIENT_URL=http://localhost:5173
PORT=4000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
```

### 3. Initialize Database & Seed
```bash
# Push schema to PostgreSQL
cd server
npx prisma db push

# Populate with sample developer profiles, skills, projects, and blogs
npx tsx prisma/seed.ts
cd ..
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend API (Express on port 4000)
npm run dev:server

# Terminal 2: Frontend Client (Vite on port 5173)
npm run dev:client
```
Visit **http://localhost:5173** in your browser!

---

## 🧪 Testing & Quality Assurance

Run the unified test suite across both packages:
```bash
npm test
```

### Test Suite Summary:
- **Server**: Jest + Supertest (`health.test.ts`)
  - Validates API health check envelope `{ success: true, data: null, message: 'ok' }`
  - Validates route protection against unauthenticated requests (HTTP 401)
- **Client**: Vitest + jsdom (`api.test.ts`)
  - Validates automatic unwrap of standardized `{ success, data, message }` responses
  - Validates client error propagation on rejected payloads

---

## 🌐 Deployment Guide

### Database (Neon)
1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string into your environment variables.

### Backend (Railway)
1. Deploy from GitHub repository selecting the `/server` subfolder.
2. Build Command: `npm install && npx prisma generate`
3. Start Command: `npm start`
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (points to Vercel URL), `NODE_ENV=production`.

### Frontend (Vercel)
1. Deploy from GitHub repository selecting the `/client` subfolder.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set environment variable: `VITE_API_URL` (points to Railway backend URL).

---

## ⏱️ 7-Minute Live Demo Script

Use this structured walkthrough for project presentations or video recordings:

| Time | Phase | Actions & Talking Points |
|---|---|---|
| **0:00 - 1:00** | **Introduction & Architecture** | • Welcome & mission: DevConnect is an end-to-end developer networking platform.<br>• Highlight the monorepo architecture: React 19 SPA + Express TypeScript + PostgreSQL with Prisma ORM. |
| **1:00 - 2:15** | **Authentication & Onboarding** | • Showcase the registration flow and local JWT authentication.<br>• Demonstrate secure cookie-based session persistence and protected route redirects. |
| **2:15 - 3:30** | **Developer Profile & Portfolio** | • Navigate to `/u/alexrivera`.<br>• Highlight the Hero banner, location, and mutual connections count.<br>• Demonstrate adding/deleting skills.<br>• Show project showcase items with live demo tags and GitHub repo buttons. |
| **3:30 - 4:45** | **Social Connections & Endorsements** | • Show Developer Discovery (`/search`) with real-time skill and location filtering.<br>• Send a connection request to a peer.<br>• Switch accounts or inspect `/network` to accept request.<br>• Show the peer endorsement feature (+1 counter) unlocked upon connection. |
| **4:45 - 5:45** | **Technical Blog & Markdown Editor** | • Open `/blog` to view community articles and view counters.<br>• Click "Write Article" to show the live split-screen Markdown editor with syntax highlighting.<br>• Publish a sample post and show its automatic appearance on the reader and dashboard. |
| **5:45 - 6:30** | **Real-Time Notifications & Dashboard** | • Trigger an endorsement or connection to show the real-time Socket.io toast popup.<br>• Open the notification center popover.<br>• Walk through the unified Dashboard stats, activity feed, and recommendations. |
| **6:30 - 7:00** | **Conclusion & Q&A** | • Summarize key achievements: 100% test pass rate, PWA ready, zero TypeScript errors, production cloud database integration.<br>• Thank the evaluators and open for questions. |
