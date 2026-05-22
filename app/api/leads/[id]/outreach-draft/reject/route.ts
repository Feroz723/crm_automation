import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/leads/[id]/outreach-draft/reject
 * Reject/Discard a specific outreach draft.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: params.id }
        }) as any;

        if (!lead || !lead.outreachDraft) {
            return NextResponse.json({ error: 'Lead or draft not found' }, { status: 404 });
        }

        const updatedDraft = {
            ...lead.outreachDraft,
            email: {
                ...lead.outreachDraft.email,
                status: 'rejected'
            }
        };

        // Update lead and log activity
        await prisma.lead.update({
            where: { id: params.id },
            data: {
                outreachDraft: updatedDraft
            } as any
        });

        await prisma.activity.create({
            data: {
                leadId: params.id,
                type: 'outreach_draft_rejected',
                description: 'Outreach draft was discarded by a human.',
            }
        });

        return NextResponse.json({ success: true, status: 'rejected' });
    } catch (error: any) {
        console.error('Draft rejection error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
