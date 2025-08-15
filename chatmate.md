---

# Project Summary (one-line)

A portfolio-grade, cross-platform **ChatMate AI** demo: Expo app (iOS/Android/Web) that offers **personality-driven AI bot DMs** and a **sandbox global real-time chat** with per-user **AI summarization + translation** — built to showcase realtime, AI streaming, offline-capable UI, and production-grade backend work.

# Goal (why)

* Create a memorable “hero project” recruiters can open instantly (web) or run locally (Expo) to test realtime features and AI bots.
* Demonstrate full-stack skills: React Native + Expo Web, real-time sockets, message streaming, AI integration (summarize/translate), secure backend architecture, and robust engineering practices.

---

# Tech Stack (final)

- **Client**: Expo (React Native + React Native Web) — single codebase for native & web
- **Server**: NestJS (TypeScript), REST + WebSocket (Socket.io) endpoints
- **DB**: PostgreSQL (Prisma ORM)
- **Queue/Worker**: Valkey + BullMQ (AI job queue) - migrated from Redis
- **AI**: OpenAI (official SDK, streaming) or similar (server-side)
- **State**: Zustand (local) + React Query (server state)
- **UI**: NativeBase (RN & web-compatible)
- **Auth**: JWT (short-lived access / refresh), guest tokens for web demo
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions (build/test), GHCR for images, Render / Fly for deploys
- **Logging/Monitoring**: nestjs-pino/winston, Sentry or similar for errors, Bull Board for queue ops

---

# Open-Source Alternatives to Redis + BullMQ

## Redis Alternatives

### **Valkey** (Recommended)

- Open-source fork of Redis 7.2.4, backed by AWS, Google, and major companies
- **Benefits**: Drop-in replacement, high performance, active development, strong community
- **Drawbacks**: Relatively new (2024), smaller ecosystem than Redis
- **Migration**: Direct replacement for Redis in existing BullMQ setup

### **KeyDB**

- High-performance Redis fork with multithreading support
- **Benefits**: Better performance than Redis, Redis-compatible, active development
- **Drawbacks**: Smaller community, less enterprise backing than Valkey

### **DragonflyDB**

- Modern in-memory datastore with Redis API compatibility
- **Benefits**: 25x better performance, lower memory usage, works with BullMQ
- **Drawbacks**: Different internal architecture, newer project

## Complete Queue/Worker Alternatives

### **PostgreSQL + pg-boss**

- Uses your existing PostgreSQL database for job queuing
- **Benefits**: ACID guarantees, simple setup, no additional infrastructure
- **Drawbacks**: Lower throughput than Redis-based solutions
- **Best for**: Simple job queues when you already use PostgreSQL

### **RabbitMQ + Bull alternative**

- Mature message broker with excellent routing capabilities
- **Benefits**: Reliable, supports multiple protocols, enterprise-ready
- **Drawbacks**: More complex setup, requires separate job queue library
- **Best for**: Complex routing requirements, enterprise environments

### **Apache Kafka + KafkaJS**

- High-throughput distributed event streaming platform
- **Benefits**: Excellent for event streaming, high durability, scalable
- **Drawbacks**: Overkill for simple job queues, complex setup
- **Best for**: High-volume event streaming, not ideal for simple job processing

## BullMQ-specific Alternatives (Redis-based)

### **Agenda** (MongoDB)

- **Benefits**: Persistent jobs, good for scheduled tasks, simple API
- **Drawbacks**: Requires MongoDB, less performant than Redis-based

### **Kue** (Redis)

- **Benefits**: Simple API, Redis-backed, lightweight
- **Drawbacks**: Less maintained, fewer features than BullMQ

### **Bee-Queue** (Redis)

- **Benefits**: Very lightweight and fast, minimal overhead
- **Drawbacks**: Fewer features, less active development

**Recommendation for ChatMate**: Start with **Valkey** as a direct Redis replacement to maintain BullMQ compatibility while avoiding Redis licensing concerns. For a completely different approach, consider **PostgreSQL + pg-boss** if you want to eliminate Redis dependency entirely.

---

# High-level Architecture & Flow

1. **Clients**
   - Single Expo app (`/apps/app`) serves iOS/Android/Web (Expo Web).
   - Clients call server REST endpoints for CRUD & use Socket.io for realtime.

2. **Server (Nest.js)**
   - Auth controllers (guest + real users)
   - Chat controllers (REST for history, Socket gateway for realtime)
   - AI worker producer endpoints (enqueue summarization/translation or bot responses)
   - Worker(s) (BullMQ) call OpenAI streaming and publish partial results via Valkey pub/sub to Socket.io gateway
   - Persist final messages/summaries/translations in PostgreSQL

3. **Queue & Worker**
   - UI or server enqueues AI job → BullMQ `ai-jobs` queue (metadata includes room/user/socket mapping HMAC-signed).
   - Worker pops job → streams to OpenAI → pushes chunks to Valkey pub/sub → gateway emits to socket room in real-time → worker persists final output.

4. **Realtime**
   - Socket.io gateway (Nest) + Valkey adapter for multi-instance.
   - Presence, typing indicators, message events, bot streaming chunks, job status events.

5. **Bots & AI**
   - Bot jobs created by user action (open DM with bot) or system triggers.
   - Each bot has a persona prompt template and per-user context (cleared for guests on logout).
   - Summarize/translate jobs can be triggered manually or automatically for long messages.

6. **Persistence**
   - Messages table (senderId, roomId, text, meta, language, type \[user|bot|system], createdAt).
   - Summaries table (messageId, summaryText, model, createdAt).
   - Bot contexts table (userId, botId, context blobs) — ephemeral for guests.

---

# Folder Layout (recommended)

```
/apps
  /app                # Expo RN app (native + web)
    /src
      /assets
      /components
      /features
      /hooks
      /lib             # api client, sockets, storage
      /screens
      App.tsx
  /api               # NestJS backend
    /src
        /modules
        /auth
        /chat
        /ai
        /users
    main.ts
/packages
  /utils
  /types
pnpm-workspace.yaml
```

---

# API Surface (key endpoints & socket events)

## REST (examples)

- `POST /auth/guest` → returns `{ token, expiresAt, userId }` for demo web guests.
- `POST /auth/login` → real login
- `GET  /chats/:roomId/messages?limit=&before=` → paginated messages
- `POST /messages` → send message (also emitted via socket)
- `POST /ai/summarize` → enqueue summary job for messageId
- `POST /ai/translate` → enqueue translation job (messageId + targetLang)

## WebSocket (Socket.io)

- Client connects: `socket.auth = { token }`
- Events (client → server):
  - `joinRoom` { roomId }
  - `leaveRoom` { roomId }
  - `typing` { roomId, isTyping }
  - `sendMessage` { roomId, text }
  - `startBotDM` { botId, initialPrompt }

- Events (server → client):
  - `message` { message }
  - `messageChunk` { jobId, chunk } // streaming AI output
  - `jobStatus` { jobId, status }
  - `presenceUpdate` { users\[] }
  - `typingUpdate` { userId, isTyping }
  - `summary` { messageId, text }
  - `translation` { messageId, text, lang }

---

# Data Models (simplified)

```ts
type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  createdAt: Date;
};

type Message = {
  id: string;
  roomId: string;
  senderId?: string; // null for system/bot
  text: string;
  language?: string;
  type: 'user' | 'bot' | 'system';
  createdAt: Date;
};

type BotContext = {
  id: string;
  userId: string;
  botId: string;
  context: string; // serialized short history
  updatedAt: Date;
};
```

---

# Bot Personas & Prompt Templates (practical)

Store these server-side (config / DB) and use them to seed AI jobs.

**Ivy the Inventor**

```
You are Ivy, a quirky inventor who explains tech in playful, excited style. Keep responses short, optimistic, include one fun gadget idea per reply. Use simple analogies.
```

**Dex the Detective**

```
You are Dex, a calm, witty detective. Provide concise, observant replies, use detective metaphors, and ask clarifying Qs when needed.
```

**Luna the Storyteller**

```
You are Luna, a whimsical storyteller. When answering, weave in a short 2-sentence imaginative metaphor or mini-story relevant to the user message.
```

**Coach Max**

```
You are Coach Max, supportive and practical. Offer empathetic advice and 2 quick action steps.
```

**Chaz the Sarcastic Wit**

```
You are Chaz, quick-witted and sarcastic but friendly. Use light sarcasm and pop-culture one-liners; avoid being mean.
```

**Usage**: Prepend persona template + short system instruction (safety guardrails) + recent user messages to the job prompt.

---

# Coding Rules & Best Practices (concise, actionable)

These should be enforced by linters, CI checks, and PR reviewers.

- **TypeScript strict**: `noImplicitAny`, `strictNullChecks` on. No `any` unless justified and documented.
- **One export per file** (prefer named exports).
- **Naming**: `kebab-case` for files/folders, `PascalCase` for components/classes, `camelCase` for variables/functions, `SCREAMING_CASE` for constants.
- **Functions**: small, single-purpose, verb-noun names: `fetchMessages`, `sendMessage`, `enqueueAiJob`.
- **Components**: functional only (hooks), keep < 200 lines, split responsibilities.
- **State**: React Query for server reads/writes; Zustand for UI ephemeral state. Avoid mixing responsibilities.
- **No anonymous functions** in render lists; use `useCallback` and memoize child components (`React.memo`).
- **FlatList/FlashList**: supply stable keys and `estimatedItemSize`.
- **Error Handling**: server returns `{ success, data?, error? }`; clients handle gracefully, show user-friendly messages.
- **Security**: validate input on server (DTOs + `class-validator`), HMAC job_meta for worker mapping, rate-limit guest endpoints.
- **Logging**: structured logs with request id & userId; redact secrets.
- **Docs**: JSDoc on exported functions & classes; `README.md` in each feature folder with purpose, usage, deps.
- **Tests**: unit tests for utils/services; integration/e2e for API endpoints and worker pipeline.
- **Performance**: avoid unnecessary re-renders, lazy-load heavy UI, debounce search/typing operations.

---

# Documentation & Naming Conventions (practical)

- **Top-level README**: project overview, running dev, env vars, key commands.
- **Feature README**: in `/server/src/modules/chat/README.md` include: purpose, API routes, DB models, sample requests.
- **Code comments**: only for why, not what. Prefer self-documenting names.
- **OpenAPI / Postman**: maintain exported API docs for main REST endpoints.
- **Types**: place shared DTOs in `/packages/types` and import.

---

# Versioning, Branching & Releases

- **Branching**:
  - `main` — production-ready code
  - `dev` — integration/staging
  - `feat/<short>` — new features
  - `fix/<short>` — bug fixes
  - `hotfix/<short>` — urgent prod patches

- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Releases**: semantic versioning (MAJOR.MINOR.PATCH), automatic changelogs via `semantic-release`.
- **CI rules**: PRs must pass lint, typecheck, unit tests, and integration smoke tests before merge.

---

# CI/CD & Deployment (recommendation)

- **CI (GitHub Actions)**:
  - `lint` job (ESLint + Prettier)
  - `typecheck` job (tsc)
  - `test` job (Jest unit)
  - `build` job (server Docker build)
  - `e2e` job: minimal end-to-end (api + worker flow)

- **CD**:
  - Build & push server container to GHCR.
  - Deploy server to Render / Fly / Railway (or your provider) with env secrets.
  - No app store pushes required for demo; Expo Publish for OTA and Expo EAS builds if needed.

- **Secrets**: store API keys and JOB_META_SECRET in CI secrets and Render/Fly secret store.
- **Monitoring**: Sentry for errors, Prometheus/Datadog for metrics if needed.

---

# Worker & AI Streaming Pattern (detailed)

1. UI triggers `POST /ai/bot` or `POST /ai/summarize`.
2. Server enqueues job to `ai-jobs` with metadata: `{ jobId, userId, roomId, jobType, metaSignature }`.
3. Worker picks job, verifies metadata signature (HMAC + JOB_META_SECRET).
4. Worker opens OpenAI streaming API (official SDK). Streams chunks as they arrive.
5. Worker publishes chunks to Valkey pub/sub channel `ai-stream:{jobId}`.
6. Socket Gateway subscribed to `ai-stream:{jobId}` emits `messageChunk` events to the associated socket room.
7. On completion, worker persists final content and publishes `jobStatus: done`. Gateway emits `summary|translation` event.
8. DLQ: failed jobs move to DLQ. Admin requeue API exists to re-run jobs.

---

# Security & Abuse Mitigation

- **Guest tokens**: short TTL (e.g., 1 hour), limited rate & capabilities.
- **Rate limiting**: per-IP and per-token quotas; different for guests vs authenticated users.
- **HMAC job_meta**: prevents job spoofing/routing errors.
- **Sanitization**: disallow JS/HTML injection in messages.
- **Moderation**: optional content moderation pipeline (automated) for public sandbox chat.

---

# Roadmap & Milestones (practical)

**Milestone 0 (Day 0)** — repo + pnpm workspace, Nest skeleton, Expo skeleton, shared types, env examples
**Milestone 1 (Week 1)** — Guest token auth, basic chat REST, Socket.io gateway, Expo UI chat screen, global sandbox (mock data)
**Milestone 2 (Week 2)** — Message send/receive real-time, presence & typing, React Query/Zustand integration, UI polish
**Milestone 3 (Week 3)** — AI job queue scaffold (BullMQ + Redis), worker stub (mock streaming), bot persona config, streaming chunks to UI
**Milestone 4 (Week 4)** — Hook OpenAI streaming, summarization & translation endpoints, persist outputs, admin DLQ UI, basic CI workflows
**Milestone 5 (Week 5)** — Tests, error handling, logging, deployment to Render, Expo web smoke test, documentation, final polish for portfolio

(Adjust pacing to your time; these are aggressive 1–5 week targets if you work full-time.)

---

# Example dev commands

```bash
# root
pnpm install
pnpm -w dev        # runs concurrently via scripts: dev:server dev:app

# server
pnpm --filter server dev

# app
pnpm --filter app start
pnpm --filter app web         # expo web
```

---

# Final notes (objective guidance)

- **Expo-only** is the pragmatic choice for this demo: single React version across platforms, faster iteration, fewer dependency mismatches. It sacrifices SSR/SEO — acceptable for a recruiter-first demo where instant access matters more than search ranking.
- Keep AI and secret-heavy work server-side. Show streaming to stand out — recruiters love smooth streaming UIs and real-time debug evidence (logs, job status).
- Build incrementally; prefer a minimal working demo early (global sandbox + one bot personality) then add streaming, summarization, translation, and advanced infra (DLQ, HMAC, distributed workers).

---
