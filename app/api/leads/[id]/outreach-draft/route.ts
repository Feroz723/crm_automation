import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOutreachDraft } from '@/lib/ai/generateOutreachDraft';
import { AIMetadata } from '@/lib/types';

/**
 * POST /api/leads/[id]/outreach-draft
 * Generates and saves an AI outreach draft for a verified lead.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch lead and its metadata
        const lead = await prisma.lead.findUnique({
            where: { id: params.id },
            include: { activities: true }
        }) as any;

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // GUARD CONDITIONS
        // 1. Must be verified by a human
        if (lead.reviewStatus !== 'verified') {
            return NextResponse.json(
                { error: 'Drafts can only be generated for human-verified leads.' },
                { status: 403 }
            );
        }

        // 2. AI Confidence should be >= 0.85 (as per Phase 3.0 prompt)
        const aiMeta = lead.aiMetadata as unknown as AIMetadata;
        const confidence = aiMeta?.confidence || 0;

        if (confidence < 0.85) {
            return NextResponse.json(
                { error: `AI confidence (${Math.round(confidence * 100)}%) is too low to auto-generate a draft. Manual verification required.` },
                { status: 403 }
            );
        }

        // Generate draft
        const draft = await generateOutreachDraft(
            {
                fullName: lead.fullName,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                source: lead.source,
                message: lead.notes || lead.rawData?.toString(), // Use notes or raw message context
                intent: lead.intent,
                score: lead.score
            },
            aiMeta
        );

        // Save draft to lead
        const updatedLead = await prisma.lead.update({
            where: { id: params.id },
            data: {
                outreachDraft: draft as any,
                automationStatus: 'not_simulated'
            } as any
        });

        // Log activity
        const activityType = lead.outreachDraft ? 'outreach_draft_regenerated' : 'outreach_draft_generated';

        await prisma.activity.create({
            data: {
                leadId: params.id,
                type: activityType,
                description: lead.outreachDraft
                    ? 'AI Outreach draft was regenerated.'
                    : 'AI Outreach draft was successfully generated.',
                metadata: {
                    tone: draft.email.tone,
                    subject: draft.email.subject
                }
            }
        });

        return NextResponse.json({ success: true, draft: draft.email });
    } catch (error: any) {
        console.error('Draft generation API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
