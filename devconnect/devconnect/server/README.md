# DevConnect — Server (REST API & Real-time WebSockets)

The backend server for DevConnect is a secure, high-performance Node.js / Express service written in TypeScript, backed by PostgreSQL via Prisma ORM.

## 🛠️ Tech Stack & Architecture

- **Runtime & Framework**: Node.js, Express.js (TypeScript)
- **Database & ORM**: PostgreSQL (hosted on Neon) with Prisma ORM
- **Authentication**: JWT stored in `httpOnly` secure cookies + GitHub OAuth 2.0
- **Real-Time Communication**: Socket.io for room-based notification broadcasting (`user:{userId}`)
- **File Uploads**: Multer memory storage + Cloudinary API for optimized avatar hosting (max 2MB)
- **Validation**: Zod schema validation on all mutation endpoints
- **Security**: Helmet headers, CORS credentials whitelist, bcrypt password hashing, rate limiting
- **Testing**: Jest + Supertest for HTTP endpoint testing

## 📁 Directory Structure

```
server/
├── prisma/
│   ├── schema.prisma       # Database schema models (User, Project, BlogPost, Skill, etc.)
│   └── seed.ts             # Database seeder with sample profiles, skills, and articles
├── src/
│   ├── routes/
│   │   ├── auth.ts         # /api/auth (register, login, logout, me, GitHub OAuth)
│   │   ├── users.ts        # /api/users (search, profile CRUD, avatar, skills, projects)
│   │   ├── social.ts       # /api/connections, /api/endorse, /api/notifications, /api/dashboard
│   │   └── blog.ts         # /api/posts (CRUD, view counter, author filtering)
│   ├── app.ts              # Express middleware & router mounting
│   ├── index.ts            # HTTP & Socket.io server bootstrap
│   ├── lib.ts              # Prisma singleton, auth guards, response envelopes, notify helper
│   └── health.test.ts      # Jest integration tests
├── .env                    # Environment configuration
└── package.json
```

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Push schema to database
npx prisma db push

# 3. Start development server with live reload
npm run dev
```

API runs on `http://localhost:4000`.

## 🧪 Testing

```bash
npm test
```
Runs Jest & Supertest suites validating health checks and route protection.
