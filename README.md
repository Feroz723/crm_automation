# AI-Powered Lead Generation CRM Automation

An intelligent CRM platform that captures leads from multiple sources, enriches them with AI, scores them automatically, and automates outreach — all with built-in safety guardrails.

---

## Features

### Lead Management
- **Multi-Source Capture** — Ingest leads from Facebook Ads, Google Ads, WhatsApp, website forms, n8n workflows, and manual entry
- **Unified Dashboard** — View, filter, search, and manage all leads in one place
- **Kanban Pipeline** — Drag-and-drop leads across stages: New → Contacted → Qualified → Proposal → Won / Lost

### AI-Powered Intelligence
- **Lead Enrichment** — Automatically extract intent, interests, pain points, and next actions using Groq (LLaMA 3.1) with Gemini fallback
- **Smart Scoring** — AI-calculated 0–100 lead scores based on source quality, contact completeness, message quality, and urgency signals
- **Outreach Drafting** — Generate personalized email drafts with tone selection (formal, friendly, consultative)
- **Lead Summaries** — One-click AI summaries with urgency classification, objections, and talking points

### Automation Engine
- **3-Tier Execution Model**:
  - 🟢 **Live Mode** — Real delivery for whitelisted, compliant leads
  - 🟡 **Shadow Mode** — Full pipeline execution logged without actual delivery
  - 🔴 **Simulation Mode** — Safe dry-run with activity logging
- **Outreach Handshake Validation** — Opt-out checks, rate limiting, and compliance verification before any delivery
- **Rate Limiting** — Configurable hourly/daily send limits per organization

### Integrations
- **HubSpot CRM Sync** — Two-way contact sync with automatic retry and exponential backoff
- **Webhook Ingestion** — Cloudflare Worker endpoint for real-time lead capture from any source
- **n8n Workflow Support** — Integration token authentication for workflow automation

### Analytics & Compliance
- **Dashboard Analytics** — Lead volume trends, source distribution, conversion rates, and score breakdowns
- **Activity Timeline** — Full audit trail of every action, AI decision, and status change per lead
- **Shadow Logs** — Complete record of what *would have been sent* in shadow mode
- **Opt-Out Management** — Per-channel (Email, WhatsApp) opt-out tracking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Auth** | Firebase Authentication (Client + Admin SDK) |
| **AI** | Groq (LLaMA 3.1 70B) + Google Gemini 1.5 Flash |
| **CRM** | HubSpot API v3 |
| **Edge Workers** | Cloudflare Workers (Wrangler) |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Drag & Drop** | React DnD |
| **Validation** | Zod |
| **Icons** | Lucide React |

---

## Project Structure

```
crm_automation/
├── app/
│   ├── (auth)/              # Login & Signup pages
│   ├── api/
│   │   ├── analytics/       # Analytics data endpoints
│   │   ├── compliance/      # Opt-out & compliance APIs
│   │   ├── config/          # System configuration APIs
│   │   ├── crm/             # HubSpot sync endpoints
│   │   ├── demo/            # Demo data seeding
│   │   ├── integrations/    # Integration token management
│   │   ├── leads/           # Lead CRUD & AI operations
│   │   └── logs/            # Webhook log viewer
│   ├── dashboard/
│   │   ├── analytics/       # Analytics dashboard page
│   │   ├── integrations/    # Integration settings page
│   │   ├── leads/           # Lead list & detail pages
│   │   ├── logs/            # Webhook logs page
│   │   ├── pipeline/        # Kanban pipeline page
│   │   └── settings/        # System settings page
│   └── onboarding/          # User onboarding flow
├── components/
│   ├── ai/                  # AI Insights panel
│   ├── analytics/           # Chart & stat widgets
│   ├── dashboard/           # Demo banner & injector
│   ├── leads/               # Lead card & timeline components
│   └── ui/                  # Score, Source, Status badges
├── lib/
│   ├── ai/                  # AI client, enrichment, scoring, email gen
│   ├── automation/          # Automation engine, planner, delivery providers
│   ├── crm/                 # HubSpot integration
│   ├── db/                  # Prisma client singleton
│   └── firebase/            # Firebase client & admin config
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── workers/
│   ├── webhook.ts           # Cloudflare Worker for webhook ingestion
│   └── wrangler.toml        # Wrangler configuration
└── docs/
    ├── deployment_guide.md  # Deployment instructions
    ├── n8n_instructions.md  # n8n integration guide
    └── sample_payloads.json # Sample webhook payloads
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** database (recommend [Neon](https://neon.tech) for serverless)
- **Firebase** project with Authentication enabled
- **Groq** and/or **Gemini** API keys

### Installation

```bash
# Clone the repository
git clone https://github.com/Feroz723/crm_automation.git
cd crm_automation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials
```

### Environment Variables

Copy `.env.example` and fill in the values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client-side config |
| `FIREBASE_ADMIN_*` | Firebase Admin SDK credentials |
| `GROQ_API_KEY` | Groq API key for LLaMA models |
| `GEMINI_API_KEY` | Google Gemini API key (fallback) |
| `HUBSPOT_API_KEY` | HubSpot private app access token |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy Webhook Worker

```bash
# Development
npm run worker:dev

# Production
npm run worker:deploy
```

---

## API Endpoints

### Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List all leads (with filters) |
| `POST` | `/api/leads` | Create a new lead |
| `GET` | `/api/leads/[id]` | Get lead details |
| `PATCH` | `/api/leads/[id]` | Update lead |
| `DELETE` | `/api/leads/[id]` | Delete lead |

### AI Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/leads/[id]/enrich` | AI-enrich a lead |
| `POST` | `/api/leads/[id]/score` | Calculate AI lead score |
| `POST` | `/api/leads/[id]/summary` | Generate AI lead summary |
| `POST` | `/api/leads/[id]/outreach` | Generate outreach draft |

### Webhook
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/lead/webhook` | Ingest lead from external source |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics` | Dashboard analytics data |

---

## Webhook Payload Example

```json
{
  "source": "facebook",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "message": "Interested in enterprise pricing"
}
```

See [`docs/sample_payloads.json`](docs/sample_payloads.json) for more examples including Google Ads, WhatsApp, and n8n payloads.

---

## License

This project is proprietary. All rights reserved.
