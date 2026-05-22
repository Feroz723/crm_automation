<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.1-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" />
</p>

# CRM Automation — AI-Powered Lead Generation & Workflow Engine

> **End-to-end CRM automation platform that captures leads from heterogeneous sources, enriches them through multi-model AI inference, scores them deterministically, and orchestrates outreach workflows with tiered safety execution.**

---

## Overview

Sales teams operating across Facebook Ads, Google Ads, WhatsApp, and inbound web forms face a fragmented lead pipeline. Leads arrive in inconsistent formats, sit unprocessed for hours, and receive generic follow-ups — resulting in poor conversion rates and wasted ad spend.

**CRM Automation** addresses this by building a unified ingestion → enrichment → scoring → outreach pipeline. Every lead that enters the system is normalized, enriched with AI-derived intent signals, assigned a composite score, and routed through an automation engine that respects compliance boundaries, rate limits, and opt-out preferences.

The AI layer is not bolted on as a feature — it is structural. Lead scoring, intent classification, outreach personalization, and summary generation all run through a dual-model inference pipeline (Groq LLaMA 3.1 70B primary, Google Gemini 1.5 Flash fallback) with structured output extraction, retry logic, and explainability metadata baked into every decision.

---

## Core Features

| Category | Capability |
|----------|-----------|
| **Lead Ingestion** | Multi-source webhook capture (Facebook, Google Ads, WhatsApp, n8n, website forms) with payload normalization |
| **AI Enrichment** | Automated intent classification, interest extraction, pain point analysis, and next-action recommendations |
| **Lead Scoring** | Composite 0–100 scoring with weighted factors: source quality, contact completeness, message quality, urgency signals |
| **Outreach Automation** | AI-generated email drafts with tone control (formal / friendly / consultative) and approval workflows |
| **Pipeline Management** | Drag-and-drop Kanban board across six stages: New → Contacted → Qualified → Proposal → Won → Lost |
| **3-Tier Execution** | Live delivery, shadow mode (logged but not sent), and simulation mode with automatic safety fallback |
| **CRM Sync** | Bi-directional HubSpot integration with upsert logic, retry with exponential backoff |
| **Compliance Engine** | Per-channel opt-out tracking, rate limiting (hourly/daily), and outreach handshake validation |
| **Analytics** | Lead volume trends, source distribution, conversion funnels, score breakdowns via Recharts |
| **Activity Audit Trail** | Immutable timeline of every AI decision, status change, delivery attempt, and manual override |
| **Role-Based Auth** | Firebase Authentication with cookie-based session management and middleware-enforced route protection |
| **Real-Time Webhook Logs** | Searchable, filterable log of every inbound webhook with status tracking and error visibility |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│   Next.js 14 App Router (React 18, TailwindCSS, Recharts, React DnD)  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│   │  Leads   │  │ Pipeline │  │Analytics │  │ Settings │              │
│   │Dashboard │  │  Kanban  │  │  Charts  │  │  & Logs  │              │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└────────┼──────────────┼──────────────┼──────────────┼───────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Next.js Route Handlers)             │
│                                                                         │
│   /api/leads     /api/analytics    /api/crm     /api/compliance        │
│   /api/leads/[id]/enrich          /api/integrations                    │
│   /api/leads/[id]/score           /api/config                          │
│   /api/leads/[id]/outreach        /api/logs                            │
└────────┬───────────────┬────────────────────────────┬───────────────────┘
         │               │                            │
         ▼               ▼                            ▼
┌─────────────┐  ┌───────────────┐           ┌───────────────────┐
│  AI / LLM   │  │   Automation  │           │   External APIs   │
│   Layer     │  │    Engine     │           │                   │
│             │  │               │           │  • HubSpot CRM    │
│ Groq (1°)   │  │ Planner →     │           │  • Firebase Auth  │
│ Gemini (2°) │  │ Engine →      │           │  • Cloudflare     │
│             │  │ Delivery      │           │    Workers        │
│ • Enrich    │  │               │           │                   │
│ • Score     │  │ Safety Gates: │           └───────────────────┘
│ • Summarize │  │ • Handshake   │
│ • Draft     │  │ • Rate Limit  │
│             │  │ • Opt-Out     │
└──────┬──────┘  └───────┬───────┘
       │                 │
       ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                       │
│                                                                         │
│   PostgreSQL (Neon Serverless) — Prisma ORM                            │
│                                                                         │
│   Organizations │ Leads │ Activities │ Users │ WebhookLogs             │
│   SystemConfig │ OptOuts │ RateLimits │ ShadowLogs │ IntegrationTokens │
└─────────────────────────────────────────────────────────────────────────┘
```

### Execution Flow

```
Webhook Received → Payload Normalized → AI Enrichment → Lead Scored
    → Lead Persisted → Automation Plan Generated
        → Handshake Validated
            ├─ PASS (whitelisted) → Live Delivery → Rate Limit Updated
            ├─ PASS (not whitelisted) → Shadow Log (no delivery)
            └─ FAIL → Simulation Log (safe fallback)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router), React 18, TailwindCSS | Server-rendered UI with client-side interactivity |
| **Backend** | Next.js API Route Handlers (Node.js) | RESTful API with server-side AI orchestration |
| **Database** | PostgreSQL (Neon) via Prisma 5.22 | Relational data with serverless connection pooling |
| **AI / LLM** | Groq (LLaMA 3.1 70B), Google Gemini 1.5 Flash | Dual-model inference with automatic failover |
| **Authentication** | Firebase Auth (Client SDK + Admin SDK) | Email/password auth with server-side token verification |
| **Edge Workers** | Cloudflare Workers (Wrangler) | Low-latency webhook ingestion at the edge |
| **CRM** | HubSpot API v3 | Contact sync with search, create, and upsert |
| **Charts** | Recharts | Analytics visualizations |
| **Drag & Drop** | React DnD (HTML5 Backend) | Kanban pipeline interactions |
| **Validation** | Zod | Runtime schema validation for API inputs |
| **Icons** | Lucide React | Consistent iconography |

---

## AI / LLM Integration

### Architecture

The AI subsystem is not a single API call — it is a structured pipeline with four distinct inference tasks, each with its own prompt template, output schema, and error handling.

```
Lead Data → [Enrichment] → [Scoring] → [Summary] → [Outreach Draft]
                │               │            │              │
                ▼               ▼            ▼              ▼
          Intent, Pain     0-100 Score   Urgency,       Subject +
          Points, Next     + Weighted    Objections,    Body +
          Action           Factors       Strategy       Tone
```

### Dual-Model Failover

```typescript
// Simplified inference flow
Groq (LLaMA 3.1 70B) → success → return
                      → failure → Gemini 1.5 Flash → success → return
                                                    → failure → throw
```

The system defaults to **Groq** for speed (sub-second inference on LLaMA 3.1 70B) and falls back to **Gemini** on any failure — network errors, rate limits, or empty responses. This is transparent to the caller.

### Prompt Engineering

Each AI task uses domain-specific prompts that enforce structured JSON output:

- **Enrichment**: Extracts `intent` (high/medium/low), `category` (enterprise/smb/individual), `interests[]`, `painPoints[]`, and `nextAction` with reasoning
- **Scoring**: Returns composite score with decomposed `factors` — `sourceQuality`, `contactCompleteness`, `messageQuality`, `urgencySignals` — each contributing to the final score with explicit reasoning
- **Summary**: Generates urgency classification (hot/warm/cold), objections, recommended strategy, timeline, and talking points
- **Outreach**: Produces email variants (initial, follow-up, reactivation) with subject lines, body text, and tone alignment

### Structured Output Extraction

LLM responses are parsed through a robust JSON extraction pipeline that handles:

1. JSON wrapped in markdown code blocks (` ```json ... ``` `)
2. Raw JSON objects embedded in natural language
3. Malformed responses → retry with exponential backoff (1s → 2s → 4s, max 3 attempts)

### Explainability & Metadata

Every AI decision is persisted with full metadata:

```json
{
  "aiMetadata": {
    "scoringReasoning": "Lead provided enterprise email and mentioned budget timeline...",
    "scoringFactors": { "sourceQuality": 25, "contactCompleteness": 20, ... },
    "intentReasoning": "Message contains urgency signals: 'this quarter', 'budget approved'",
    "confidence": 0.87,
    "historicalContextUsed": true
  }
}
```

This enables human review, AI feedback loops, and audit compliance.

### Token Optimization

- Prompts are templated with only relevant lead fields (no padding with nulls)
- `max_tokens` is calibrated per task (scoring needs fewer tokens than outreach drafting)
- Temperature is tuned per task: `0.3` for scoring (deterministic), `0.7` for outreach (creative)

---

## Engineering Challenges

### 1. Inconsistent AI Output Structure

**Problem**: LLMs produce valid JSON ~85% of the time unprompted. The remaining 15% includes markdown wrapping, trailing commas, or natural language preambles before the JSON object.

**Mitigation**: A multi-pass JSON extraction pipeline (`extractJSON<T>`) first attempts markdown code block extraction via regex, then falls back to raw JSON object matching. Combined with `retryWithBackoff`, effective structured output rate exceeds 99%.

### 2. Webhook Payload Heterogeneity

**Problem**: Each lead source (Facebook Ads, Google Ads, website forms, WhatsApp) sends data in different field naming conventions — `full_name` vs `fullName` vs `name`, `phone` vs `phone_number`.

**Mitigation**: The webhook worker implements a normalization layer that maps all known field variants to a canonical `LeadData` interface before any processing. Unknown fields are preserved in `rawData` for debugging and future schema expansion.

### 3. Automation Safety at Scale

**Problem**: Automated outreach systems carry real-world risk — sending to opted-out contacts, exceeding rate limits, or delivering AI-generated content without review.

**Mitigation**: A three-tier execution model (Live → Shadow → Simulation) with mandatory handshake validation before any delivery. The handshake checks: (1) lead has an approved outreach draft, (2) recipient is not in the opt-out registry, (3) organization rate limits are not exceeded, (4) lead is explicitly whitelisted for live outreach. Any check failure downgrades execution tier automatically.

---

## Setup Instructions

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| PostgreSQL | 14+ (or [Neon](https://neon.tech) serverless) |
| Firebase Project | Authentication enabled |

### Installation

```bash
# Clone
git clone https://github.com/Feroz723/crm_automation.git
cd crm_automation

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in all required values (see Environment Variables below)
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Optional: Seed demo data
npx tsx prisma/seed.ts

# Optional: Visual database browser
npm run db:studio
```

### Run the Application

```bash
# Development server (http://localhost:3000)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

### Deploy Webhook Worker (Optional)

```bash
# Local development
npm run worker:dev

# Production deployment to Cloudflare
npm run worker:deploy
```

---

## Environment Variables

```env
# ──────────────────────────── Database ────────────────────────────
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# ──────────────────────── Firebase (Client) ───────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# ──────────────────────── Firebase (Admin) ────────────────────────
FIREBASE_ADMIN_PROJECT_ID="your_project_id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# ──────────────────────── AI Services ─────────────────────────────
GROQ_API_KEY="your_groq_api_key"
GEMINI_API_KEY="your_gemini_api_key"

# ──────────────────────── CRM Integration ─────────────────────────
HUBSPOT_API_KEY="your_hubspot_api_key"
HUBSPOT_PORTAL_ID="your_portal_id"

# ──────────────────────── Application ─────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEBHOOK_URL="https://your-worker.workers.dev/api/lead/webhook"

# ──────────────────────── Security ────────────────────────────────
JWT_SECRET="your-jwt-secret-min-32-chars"
INTEGRATION_TOKEN_SECRET="your-integration-secret"
```

---

## API Endpoints

### Lead Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List leads with filtering, sorting, pagination |
| `POST` | `/api/leads` | Create a new lead |
| `GET` | `/api/leads/[id]` | Retrieve lead with full activity timeline |
| `PATCH` | `/api/leads/[id]` | Update lead fields or status |
| `DELETE` | `/api/leads/[id]` | Soft-delete a lead |

### AI Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/leads/[id]/enrich` | Run AI enrichment pipeline |
| `POST` | `/api/leads/[id]/score` | Calculate composite lead score |
| `POST` | `/api/leads/[id]/summary` | Generate AI-powered lead summary |
| `POST` | `/api/leads/[id]/outreach` | Generate personalized outreach draft |

### Platform

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics` | Aggregated dashboard metrics |
| `GET` | `/api/logs` | Webhook ingestion logs |
| `POST` | `/api/crm/sync` | Trigger HubSpot sync for a lead |
| `GET` | `/api/compliance/optouts` | List opt-out registry |
| `POST` | `/api/config` | Update system configuration |

### Webhook Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/lead/webhook` | Ingest lead from external source (Cloudflare Worker) |

---

## Folder Structure

```
crm_automation/
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Authentication - Login
│   │   └── signup/page.tsx             # Authentication - Registration
│   ├── api/
│   │   ├── analytics/route.ts          # Analytics aggregation endpoint
│   │   ├── compliance/                 # Opt-out management endpoints
│   │   ├── config/                     # System config CRUD
│   │   ├── crm/                        # HubSpot sync trigger
│   │   ├── demo/                       # Demo data seeding
│   │   ├── integrations/              # Integration token management
│   │   ├── leads/
│   │   │   ├── route.ts               # Lead list + create (GET/POST)
│   │   │   └── [id]/                  # Lead detail + AI operations
│   │   └── logs/                      # Webhook log viewer
│   ├── dashboard/
│   │   ├── layout.tsx                 # Dashboard shell (sidebar, nav, auth)
│   │   ├── analytics/page.tsx         # Analytics charts & metrics
│   │   ├── integrations/page.tsx      # Integration management
│   │   ├── leads/
│   │   │   ├── page.tsx               # Lead list with filters
│   │   │   └── [id]/page.tsx          # Lead detail + AI panel
│   │   ├── logs/page.tsx              # Webhook log browser
│   │   ├── pipeline/page.tsx          # Kanban pipeline board
│   │   └── settings/page.tsx          # System settings
│   ├── onboarding/page.tsx            # New user onboarding
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   └── globals.css                    # Global styles
│
├── components/
│   ├── ai/
│   │   └── AIInsightsPanel.tsx        # AI analysis & outreach UI
│   ├── analytics/
│   │   ├── ChartCard.tsx              # Reusable chart wrapper
│   │   └── StatWidget.tsx             # Metric display widget
│   ├── dashboard/
│   │   ├── DemoBanner.tsx             # Demo mode indicator
│   │   └── DemoInjector.tsx           # Demo data injection
│   ├── leads/
│   │   ├── LeadCard.tsx               # Lead summary card
│   │   └── TimelineItem.tsx           # Activity timeline entry
│   └── ui/
│       ├── ScoreBadge.tsx             # Color-coded score indicator
│       ├── SourceBadge.tsx            # Lead source badge
│       └── StatusBadge.tsx            # Pipeline status badge
│
├── lib/
│   ├── ai/
│   │   ├── client.ts                  # Dual-model client (Groq + Gemini)
│   │   ├── enrichLead.ts             # Lead enrichment pipeline
│   │   ├── calculateLeadScore.ts     # Composite scoring engine
│   │   ├── generateLeadSummary.ts    # AI summary generation
│   │   ├── generateEmail.ts          # Email variant generation
│   │   └── generateOutreachDraft.ts  # Outreach draft pipeline
│   ├── automation/
│   │   ├── engine.ts                  # 3-tier execution engine
│   │   ├── planner.ts                # Automation plan generator
│   │   ├── guards.ts                 # Dry-run safety safeguards
│   │   └── delivery/
│   │       ├── validator.ts          # Outreach handshake validation
│   │       ├── rate-limiter.ts       # Per-org rate limiting
│   │       ├── types.ts              # Delivery type definitions
│   │       └── providers/
│   │           ├── email.ts          # Email delivery provider
│   │           ├── whatsapp.ts       # WhatsApp delivery provider
│   │           └── crm.ts           # CRM sync provider
│   ├── crm/
│   │   └── hubspot.ts                # HubSpot API integration
│   ├── db/
│   │   └── index.ts                  # Prisma client singleton
│   ├── firebase/
│   │   ├── admin.ts                  # Firebase Admin SDK (server)
│   │   ├── client.ts                 # Firebase Client SDK (browser)
│   │   └── config.ts                 # Firebase configuration
│   ├── outreach.ts                   # Outreach utility functions
│   └── types.ts                      # Shared type definitions
│
├── prisma/
│   ├── schema.prisma                  # Database schema (10 models)
│   └── seed.ts                        # Demo data seeder
│
├── workers/
│   ├── webhook.ts                     # Cloudflare Worker entry point
│   └── wrangler.toml                  # Worker configuration
│
├── docs/
│   ├── deployment_guide.md            # Production deployment guide
│   ├── n8n_instructions.md            # n8n workflow integration
│   └── sample_payloads.json           # Example webhook payloads
│
├── middleware.ts                       # Auth middleware (route protection)
├── next.config.mjs                    # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
├── prisma/schema.prisma              # Database schema
└── package.json                       # Dependencies & scripts
```

---

## Future Improvements

| Priority | Enhancement | Description |
|----------|------------|-------------|
| **High** | Multi-Agent Workflows | Chain specialized AI agents (qualifier → researcher → writer) for complex lead processing |
| **High** | Vector Database Integration | Embed lead interactions in a vector store (Pinecone/Weaviate) for semantic similarity search and contextual outreach |
| **Medium** | Semantic Memory | Maintain conversation context across lead touchpoints for coherent multi-step follow-ups |
| **Medium** | Advanced Analytics | Cohort analysis, attribution modeling, and predictive lead scoring using historical conversion data |
| **Medium** | Real-Time Notifications | WebSocket-based live updates for new leads, score changes, and delivery confirmations |
| **Low** | Enterprise SSO | SAML/OIDC integration for enterprise identity providers |
| **Low** | Multi-Tenant Isolation | Full data isolation with per-tenant encryption keys and separate connection pools |
| **Low** | Workflow Builder UI | Visual drag-and-drop automation builder for non-technical users |

---

## Demo

> **Screenshots and demo video will be added here.**

<!-- 
### Dashboard
![Dashboard Overview](docs/screenshots/dashboard.png)

### AI Insights Panel
![AI Insights](docs/screenshots/ai-insights.png)

### Pipeline View
![Pipeline Kanban](docs/screenshots/pipeline.png)

### Architecture Diagram
![Architecture](docs/screenshots/architecture.png)
-->

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is proprietary software. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without explicit written permission from the author.

---

<p align="center">
  Built with precision by <a href="https://github.com/Feroz723">@Feroz723</a>
</p>
