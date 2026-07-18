# CivicLedger — Phase 1 (Core Reporting & Triage)

Serverless monorepo. A citizen reports something → it's triaged and routed →
a department resolves it → the public sees accurate status.

## Layout

```
shared/   @civicledger/shared  — types, constants, zod schemas (isomorphic)
server/   @civicledger/server  — db (RLS), domain logic, triage steps, services
          server/db/migrations — SQL (PostGIS + pgvector + RLS + rollups)
client/   Next.js app (App Router) — UI + API route handlers + workflow
```

`client` is the deployable Vercel app; it imports `server` + `shared` as
workspace packages. API route handlers in `client/src/app/api/**` are thin
serverless entrypoints that delegate into `server`.

## Stack

Next.js (App Router) · Neon Postgres (PostGIS + pgvector) · Vercel Blob ·
Vercel Workflow DevKit (`workflow`) · Auth.js.

## Getting started

```bash
npm install
cp .env.example .env            # fill DATABASE_URL(_UNPOOLED), AUTH_SECRET, etc.
npm run db:migrate              # applies server/db/migrations/*.sql
npm run db:seed                 # optional local seed data
npm run dev                     # runs the client app
```

On Vercel, set the project **Root Directory** to `client`.

## The core loop (PRD)

1. **Ingest** `POST /api/v1/reports` (+ Twilio `…/reports/sms`) — deterministic
   emergency check (pre-AI, model-free), idempotency, minimal `PENDING` row,
   direct-to-Blob upload token, enqueue workflow, `202` + tracking URL.
2. **Triage workflow** (`client/workflows/triage.ts`) — moderate → classify →
   confidence branch (auto / needs_review / manual_review) → dedup (PostGIS +
   pgvector) → route → notify → audit. Each step retryable; failures land in
   the `workflow_failures` DLQ.
3. **Department console** `/console` — assigned cases, status, notes, resolve
   (proof photo **or** reason code). RBAC via Auth.js + Postgres RLS.
4. **Public dashboard** `/dashboard` — map/list/filters, SLA badges, 30s polling
   + hourly rollups. No PII.
5. **Manual review + moderation** `/review` — low-confidence + flagged content.

## Notes / TODO before production

- Auth uses a **dev-only** credentials provider — replace with a real IdP.
- Classifier / moderation / embeddings ship as stubs — wire real providers in
  `server/src/domain/{classify,moderation,embeddings}.ts`.
- Email dispatch is a logged handoff — wire a transactional email provider.
- Jurisdiction assignment is single-tenant default — geo-fencing is Phase 2.
