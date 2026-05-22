import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enrichLead } from '@/lib/ai/enrichLead';
import { calculateLeadScore } from '@/lib/ai/calculateLeadScore';
import { generateLeadSummary } from '@/lib/ai/generateLeadSummary';
import { Prisma } from '@prisma/client';

type LeadSource = 'facebook' | 'google_ads' | 'website' | 'manual' | 'whatsapp' | string;
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | string;

interface LeadRequestBody {
    source: LeadSource;
    full_name?: string;
    fullName?: string;
    name?: string;
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    message?: string;
    comments?: string;
}

/**
 * POST /api/leads
 * Create a new lead manually or from form submission
 */
export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as LeadRequestBody;

        // Validate required fields
        if (!body.source) {
            return NextResponse.json(
                { error: 'Source is required' },
                { status: 400 }
            );
        }

        // Log webhook
        const webhookLog = await prisma.webhookLog.create({
            data: {
                rawPayload: body as any,
                status: 'pending',
                source: body.source,
            },
        });

        try {
            // Prepare lead data
            const leadData = {
                fullName: body.full_name || body.fullName || body.name || '',
                firstName: body.first_name || body.firstName || '',
                lastName: body.last_name || body.lastName || '',
                email: body.email || '',
                phone: body.phone || body.phone_number || '',
                message: body.message || body.comments || '',
                source: body.source,
            };

            // Fetch Historical Context for Closed-loop learning
            const historicalLeads = await prisma.lead.findMany({
                where: {
                    status: { in: ['won', 'lost'] },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    status: true,
                    score: true,
                    source: true,
                    notes: true,
                }
            });

            const historicalContext = historicalLeads.map((l: any) => ({
                status: l.status,
                score: l.score,
                source: l.source,
                message: l.notes || undefined,
            }));

            // AI Enrichment
            const enrichment = await enrichLead(leadData);

            // Calculate Score with Historical Context
            const scoring = await calculateLeadScore({
                ...leadData,
                firstName: enrichment.firstName || leadData.firstName,
                lastName: enrichment.lastName || leadData.lastName,
            }, historicalContext);

            // Create lead in database
            const lead = await prisma.lead.create({
                data: {
                    fullName: leadData.fullName,
                    firstName: enrichment.firstName || leadData.firstName,
                    lastName: enrichment.lastName || leadData.lastName,
                    email: leadData.email,
                    phone: leadData.phone,
                    source: leadData.source,
                    status: 'new' as LeadStatus,
                    score: scoring.score,
                    intent: enrichment.intent,
                    notes: leadData.message,
                    rawData: body as any,
                    aiEnriched: true,
                    aiMetadata: {
                        scoringReasoning: scoring.reasoning,
                        scoringFactors: scoring.factors,
                        intentReasoning: enrichment.intentReasoning,
                        confidence: scoring.confidence,
                        historicalContextUsed: historicalContext.length > 0
                    } as any,
                },
            });

            // Create activity log
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: 'enrichment',
                    description: `Lead captured from ${leadData.source} and enriched with AI. Score: ${scoring.score}/100`,
                    metadata: {
                        enrichment,
                        scoring,
                    } as any,
                },
            });

            // Update webhook log
            await prisma.webhookLog.update({
                where: { id: webhookLog.id },
                data: {
                    status: 'success',
                    leadId: lead.id,
                },
            });

            // Generate summary asynchronously (don't wait)
            generateLeadSummary({
                fullName: lead.fullName || undefined,
                firstName: lead.firstName || undefined,
                lastName: lead.lastName || undefined,
                email: lead.email || undefined,
                phone: lead.phone || undefined,
                source: lead.source as LeadSource,
                message: lead.notes || undefined,
                intent: lead.intent || undefined,
                score: lead.score,
            }).then(async (summary) => {
                await prisma.activity.create({
                    data: {
                        leadId: lead.id,
                        type: 'ai_summary',
                        description: summary.summary,
                        metadata: summary as any,
                    },
                });
            }).catch(err => console.error('Failed to generate summary:', err));

            return NextResponse.json({
                success: true,
                lead: {
                    id: lead.id,
                    name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
                    email: lead.email,
                    score: lead.score,
                    status: lead.status,
                },
            });
        } catch (error: any) {
            // Update webhook log with error
            await prisma.webhookLog.update({
                where: { id: webhookLog.id },
                data: {
                    status: 'error',
                    error: error.message,
                },
            });

            throw error;
        }
    } catch (error: any) {
        console.error('Lead creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/leads
 * List leads with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Filters
        const source = searchParams.get('source') as LeadSource | null;
        const status = searchParams.get('status') as LeadStatus | null;
        const minScore = searchParams.get('minScore');
        const maxScore = searchParams.get('maxScore');
        const search = searchParams.get('search');

        // Sort
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as Prisma.SortOrder;

        // Build where clause
        const where: Prisma.LeadWhereInput = {};

        if (source) where.source = source;
        if (status) where.status = status;
        if (minScore || maxScore) {
            where.score = {};
            if (minScore) where.score.gte = parseInt(minScore);
            if (maxScore) where.score.lte = parseInt(maxScore);
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Query database
        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: { activities: true },
                    },
                },
            }),
            prisma.lead.count({ where }),
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Leads fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
