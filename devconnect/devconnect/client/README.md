# DevConnect — Client (Frontend SPA & PWA)

The frontend client for DevConnect is a modern Single Page Application (SPA) and Progressive Web App (PWA) built with React 19, Vite, and Tailwind CSS.

## 🛠️ Tech Stack & Architecture

- **Framework**: React 19 (Hooks, Suspense, Concurrent Rendering)
- **Build Tool**: Vite 8 with Rollup chunking & dynamic code splitting
- **Styling**: Tailwind CSS with custom glassmorphism design system & Plus Jakarta Sans typography
- **State Management**:
  - **Server State**: TanStack React Query v5 (automatic query invalidation, caching, background refetching)
  - **Client State**: Zustand (toasts, mobile menu, local UI flags)
- **Real-Time Client**: Socket.io-client for real-time social notifications
- **Markdown & Code Rendering**: React-Markdown + Rehype-Highlight for syntax-highlighted technical articles
- **Testing**: Vitest with jsdom environment

## 📁 Directory Structure

```
client/
├── public/                 # Static assets & PWA manifest icons
├── src/
│   ├── pages/
│   │   ├── Auth.tsx        # Login & Register forms with GitHub OAuth
│   │   ├── Dashboard.tsx   # Activity feed, stats, trending posts, peer recommendations
│   │   ├── Profile.tsx     # Hero banner, avatar upload, skills & project CRUD, endorsements
│   │   ├── Blog.tsx        # Technical article list, reader, and split-screen Markdown editor
│   │   ├── Search.tsx      # Developer discovery with skill/location filters & pagination
│   │   └── Network.tsx     # Connection request management & peer directory
│   ├── App.tsx             # Main routing, glass navbar, notification popover & toasts
│   ├── api.ts              # Type-safe API client wrapper with standardized envelopes
│   ├── store.ts            # Zustand UI store
│   ├── index.css           # Design tokens, gradients, glass cards, and utility classes
│   └── main.tsx            # App bootstrap & React Query provider
├── index.html              # HTML shell with Google Fonts
├── vite.config.ts          # Vite & Vitest configuration with PWA plugin
└── package.json
```

## 🚀 Running Locally

```bash
npm run dev
```

Server will start on `http://localhost:5173`.
Proxy is configured to forward `/api` requests to backend on port `4000`.

## 🧪 Testing

```bash
npm test
```
Runs Vitest unit tests in `src/api.test.ts`.
