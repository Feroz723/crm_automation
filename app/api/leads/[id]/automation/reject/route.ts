import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/leads/[id]/automation/reject
 * Human rejection of a simulated outreach sequence.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = (await request.json()) as any;
        const { reason } = body;

        const lead = await prisma.lead.findUnique({
            where: { id: params.id }
        }) as any;

        if (!lead || lead.automationStatus !== 'simulated') {
            return NextResponse.json(
                { error: 'Lead not found or simulation not completed.' },
                { status: 400 }
            );
        }

        // Update automation status
        await prisma.lead.update({
            where: { id: params.id },
            data: { automationStatus: 'rejected' } as any
        });

        // Log rejection
        await prisma.activity.create({
            data: {
                leadId: params.id,
                type: 'automation_plan_rejected',
                description: `The simulated automation sequence was rejected. Reason: ${reason || 'No specific reason provided.'}`,
                metadata: {
                    rejectedAt: new Date().toISOString(),
                    reason,
                    reviewer: 'Current User'
                }
            }
        });

        return NextResponse.json({ success: true, status: 'rejected' });
    } catch (error: any) {
        console.error('Automation rejection error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
