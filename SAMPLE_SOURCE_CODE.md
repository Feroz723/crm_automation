# 5.4 SAMPLE SOURCE CODE

## 5.4.1 Database Schema (Prisma ORM)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Lead {
  id               String    @id @default(uuid())
  orgId            String?   @map("org_id")
  fullName         String?   @map("full_name")
  firstName        String?   @map("first_name")
  lastName         String?   @map("last_name")
  email            String?
  phone            String?
  source           String
  status           String    @default("new")
  score            Int       @default(0)
  intent           String?
  notes            String?   @db.Text
  rawData          Json?     @map("raw_data")
  aiEnriched       Boolean   @default(false) @map("ai_enriched")
  aiMetadata       Json?     @map("ai_metadata")
  reviewStatus     String    @default("unreviewed") @map("review_status")
  automationStatus String    @default("not_simulated") @map("automation_status")
  outreachDraft    Json?     @map("outreach_draft")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  activities       Activity[]

  @@index([email])
  @@index([source])
  @@index([status])
  @@index([score])
  @@map("leads")
}

model Activity {
  id          String   @id @default(uuid())
  leadId      String   @map("lead_id")
  type        String
  description String   @db.Text
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([leadId])
  @@index([type])
  @@map("activities")
}

model WebhookLog {
  id         String   @id @default(uuid())
  rawPayload Json     @map("raw_payload")
  status     String
  source     String?
  error      String?  @db.Text
  leadId     String?  @map("lead_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("webhook_logs")
}
```

---

## 5.4.2 AI Lead Enrichment Module

```typescript
// lib/ai/enrichLead.ts

import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { EnrichmentResult } from '../types';

export async function enrichLead(leadData: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
}): Promise<EnrichmentResult> {
    const prompt = `You are a lead enrichment AI for a CRM system.
Analyze the following lead data and provide enrichment.

Lead Data:
${JSON.stringify(leadData, null, 2)}

Tasks:
1. If fullName is provided but firstName/lastName are missing, split the name
2. Analyze the message to determine:
   - Buying intent (high/medium/low)
   - Lead category (enterprise/smb/individual)
   - Interests and pain points mentioned
3. Recommend the next best action for this lead

Respond with ONLY a JSON object:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "intent": "high|medium|low",
  "intentReasoning": "detailed explanation",
  "category": "enterprise|smb|individual",
  "interests": ["interest1", "interest2"],
  "painPoints": ["pain1", "pain2"],
  "nextAction": "recommended action",
  "nextActionReasoning": "why this action"
}`;

    const response = await retryWithBackoff(() =>
        getAICompletion(prompt, { maxTokens: 800, temperature: 0.3 })
    );

    const enrichment = extractJSON<EnrichmentResult>(response);

    return {
        firstName: enrichment.firstName || leadData.firstName || null,
        lastName: enrichment.lastName || leadData.lastName || null,
        intent: enrichment.intent || 'medium',
        intentReasoning: enrichment.intentReasoning || 'Intent detected based on sentiment',
        category: enrichment.category || 'individual',
        interests: Array.isArray(enrichment.interests) ? enrichment.interests : [],
        painPoints: Array.isArray(enrichment.painPoints) ? enrichment.painPoints : [],
        nextAction: enrichment.nextAction || 'Follow up with initial outreach email',
        nextActionReasoning: enrichment.nextActionReasoning || 'Standard next step',
    };
}
```

---

## 5.4.3 AI Lead Scoring Module (with Closed-Loop Learning)

```typescript
// lib/ai/calculateLeadScore.ts

import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { ScoringResult } from '../types';

export async function calculateLeadScore(
    leadData: {
        source?: string;
        email?: string;
        phone?: string;
        message?: string;
        fullName?: string;
        firstName?: string;
        lastName?: string;
    },
    historicalContext?: Array<{
        status: string;
        score: number;
        source: string;
        message?: string;
    }>
): Promise<ScoringResult> {
    const contextPrompt = historicalContext && historicalContext.length > 0
        ? `\nHistorical Context (Past outcomes):
${JSON.stringify(historicalContext, null, 2)}
Use these examples to calibrate scoring. If many 'won' leads came from
a specific source, weight that source higher.`
        : '';

    const prompt = `You are an expert lead scoring AI.
Analyze the lead data and assign a score (0-100).${contextPrompt}

Lead Data:
${JSON.stringify(leadData, null, 2)}

Scoring Criteria:
1. Source Quality (0-25): Conversion likelihood by channel
2. Contact Completeness (0-25): Reward email, phone, full name
3. Message Quality (0-30): Business needs, budget, urgency
4. Professionalism (0-20): Domain quality, data clarity

Respond with ONLY a JSON object:
{
  "score": 75,
  "confidence": 0.9,
  "reasoning": "Detailed explanation of the score",
  "factors": {
    "sourceQuality": 20,
    "contactCompleteness": 20,
    "messageQuality": 25,
    "urgencySignals": 10
  }
}`;

    const response = await retryWithBackoff(() =>
        getAICompletion(prompt, { maxTokens: 500, temperature: 0.2 })
    );

    const result = extractJSON<ScoringResult>(response);
    const score = Math.max(0, Math.min(100, result.score || 50));

    return {
        score,
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || 'Score calculated based on quality factors',
        factors: result.factors || {
            sourceQuality: 15,
            contactCompleteness: 15,
            messageQuality: 15,
            urgencySignals: 5,
        },
    };
}
```

---

## 5.4.4 Webhook API – Lead Capture Endpoint

```typescript
// app/api/leads/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enrichLead } from '@/lib/ai/enrichLead';
import { calculateLeadScore } from '@/lib/ai/calculateLeadScore';
import { generateLeadSummary } from '@/lib/ai/generateLeadSummary';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Log incoming webhook
        const webhookLog = await prisma.webhookLog.create({
            data: {
                rawPayload: body,
                status: 'pending',
                source: body.source,
            },
        });

        // Prepare lead data (supports multiple field name formats)
        const leadData = {
            fullName: body.full_name || body.fullName || body.name || '',
            firstName: body.first_name || body.firstName || '',
            lastName: body.last_name || body.lastName || '',
            email: body.email || '',
            phone: body.phone || body.phone_number || '',
            message: body.message || body.comments || '',
            source: body.source,
        };

        // Fetch historical leads for closed-loop learning
        const historicalLeads = await prisma.lead.findMany({
            where: { status: { in: ['won', 'lost'] } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { status: true, score: true, source: true, notes: true },
        });

        // AI Pipeline: Enrich → Score → Create
        const enrichment = await enrichLead(leadData);
        const scoring = await calculateLeadScore(
            { ...leadData, firstName: enrichment.firstName || leadData.firstName },
            historicalLeads
        );

        // Save to database
        const lead = await prisma.lead.create({
            data: {
                fullName: leadData.fullName,
                firstName: enrichment.firstName || leadData.firstName,
                lastName: enrichment.lastName || leadData.lastName,
                email: leadData.email,
                phone: leadData.phone,
                source: leadData.source,
                status: 'new',
                score: scoring.score,
                intent: enrichment.intent,
                notes: leadData.message,
                rawData: body,
                aiEnriched: true,
                aiMetadata: {
                    scoringReasoning: scoring.reasoning,
                    scoringFactors: scoring.factors,
                    intentReasoning: enrichment.intentReasoning,
                    confidence: scoring.confidence,
                },
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                leadId: lead.id,
                type: 'enrichment',
                description: `Lead captured from ${leadData.source}. Score: ${scoring.score}/100`,
                metadata: { enrichment, scoring },
            },
        });

        return NextResponse.json({
            success: true,
            lead: { id: lead.id, score: lead.score, status: lead.status },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

---

## 5.4.5 Firebase Authentication – Login Page

```tsx
// app/(auth)/login/page.tsx

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { firebaseSignIn } from '@/lib/firebase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const user = await firebaseSignIn(email, password)
            const token = await user.getIdToken()

            // Set auth cookie for middleware verification
            document.cookie = `fb-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
                <p className="text-neutral-500 text-center mb-8">Sign in to your CRM dashboard</p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" required
                        className="w-full px-4 py-3 border rounded-lg" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password" required
                        className="w-full px-4 py-3 border rounded-lg" />
                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
```

---

## 5.4.6 Middleware – Route Protection

```typescript
// middleware.ts

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('fb-token')?.value
    const { pathname } = request.nextUrl

    // No token + protected route → redirect to login
    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Has token + auth pages → redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 5.4.7 Analytics API – Dashboard Statistics

```typescript
// app/api/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Leads by source
    const leadsBySource = await prisma.lead.groupBy({
        by: ['source'],
        _count: true,
        where: { createdAt: { gte: startDate } },
    });

    // Leads by status
    const leadsByStatus = await prisma.lead.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } },
    });

    // Score distribution using raw SQL
    const scoreDistribution = await prisma.$queryRaw`
        SELECT
            CASE
                WHEN score BETWEEN 0 AND 20 THEN '0-20'
                WHEN score BETWEEN 21 AND 40 THEN '21-40'
                WHEN score BETWEEN 41 AND 60 THEN '41-60'
                WHEN score BETWEEN 61 AND 80 THEN '61-80'
                WHEN score BETWEEN 81 AND 100 THEN '81-100'
            END as range,
            COUNT(*) as count
        FROM leads
        WHERE created_at >= ${startDate}
        GROUP BY range ORDER BY range
    `;

    // Conversion metrics
    const totalLeads = await prisma.lead.count({ where: { createdAt: { gte: startDate } } });
    const wonLeads = await prisma.lead.count({ where: { status: 'won', createdAt: { gte: startDate } } });
    const avgScore = await prisma.lead.aggregate({ _avg: { score: true }, where: { createdAt: { gte: startDate } } });

    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return NextResponse.json({
        leadsBySource: leadsBySource.map(item => ({ source: item.source, count: item._count })),
        leadsByStatus: leadsByStatus.map(item => ({ status: item.status, count: item._count })),
        scoreDistribution,
        stats: {
            totalLeads,
            wonLeads,
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageScore: Math.round((avgScore._avg.score || 0) * 100) / 100,
        },
    });
}
```

---

## 5.4.8 Pipeline – Drag and Drop Kanban Board (React Component)

```tsx
// app/dashboard/pipeline/page.tsx

'use client'
import React, { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

const COLUMNS = [
    { id: 'new', title: 'New Leads' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'proposal', title: 'Proposal' },
    { id: 'won', title: 'Won' },
    { id: 'lost', title: 'Lost' },
]

export default function PipelinePage() {
    const [leads, setLeads] = useState([])

    useEffect(() => { fetchLeads() }, [])

    const fetchLeads = async () => {
        const response = await fetch('/api/leads?limit=100')
        const data = await response.json()
        setLeads(data.leads || [])
    }

    const moveLead = async (leadId, newStatus) => {
        // Optimistic update
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex gap-6 overflow-x-auto">
                {COLUMNS.map(column => (
                    <PipelineColumn
                        key={column.id}
                        column={column}
                        leads={leads.filter(l => l.status === column.id)}
                        onDropLead={(leadId) => moveLead(leadId, column.id)}
                    />
                ))}
            </div>
        </DndProvider>
    )
}

function PipelineColumn({ column, leads, onDropLead }) {
    const [{ isOver }, drop] = useDrop({
        accept: 'LEAD',
        drop: (item) => onDropLead(item.id),
        collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    })

    return (
        <div ref={drop} className={`w-80 rounded-xl border ${isOver ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <h2 className="p-4 font-semibold">{column.title}
                <span className="ml-2 text-xs bg-white rounded-full px-2">{leads.length}</span>
            </h2>
            <div className="p-3 space-y-3">
                {leads.map(lead => <PipelineCard key={lead.id} lead={lead} />)}
            </div>
        </div>
    )
}

function PipelineCard({ lead }) {
    const [{ isDragging }, drag] = useDrag({
        type: 'LEAD',
        item: { id: lead.id },
        collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    })

    return (
        <div ref={drag} className={`bg-white p-4 rounded-lg border shadow-sm cursor-grab
            ${isDragging ? 'opacity-50' : ''}`}>
            <h3 className="font-medium">{lead.firstName} {lead.lastName}</h3>
            <p className="text-xs text-gray-500">{lead.email}</p>
            <div className="mt-2 flex justify-between">
                <span className="text-xs font-bold text-blue-600">Score: {lead.score}</span>
                <span className="text-xs text-gray-400">{lead.source}</span>
            </div>
        </div>
    )
}
```
