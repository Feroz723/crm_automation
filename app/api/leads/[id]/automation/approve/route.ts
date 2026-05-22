import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/leads/[id]/automation/approve
 * Final human approval of a simulated outreach sequence.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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
            data: { automationStatus: 'approved' } as any
        });

        // Log completion
        await prisma.activity.create({
            data: {
                leadId: params.id,
                type: 'automation_plan_approved',
                description: 'The simulated automation sequence was reviewed and approved for future delivery.',
                metadata: {
                    approvedAt: new Date().toISOString(),
                    reviewer: 'Current User' // Placeholder for future auth context
                }
            }
        });

        return NextResponse.json({ success: true, status: 'approved' });
    } catch (error: any) {
        console.error('Automation approval error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
