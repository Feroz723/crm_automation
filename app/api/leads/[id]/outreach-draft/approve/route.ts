import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAutomationPlan } from '@/lib/automation/planner';
import { simulateAutomationExecution } from '@/lib/automation/engine';

/**
 * POST /api/leads/[id]/outreach-draft/approve
 * Human sign-off on a specific outreach draft.
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

        // Safety Gate: Only allow approval if lead is human-verified
        if (lead.reviewStatus !== 'verified') {
            return NextResponse.json(
                { error: 'Cannot approve draft for an unverified lead. Please verify the lead first.' },
                { status: 403 }
            );
        }

        // Safety Gate 2: High AI Confidence
        const confidence = (lead.aiMetadata as any)?.confidence || 0;
        if (confidence < 0.85) {
            return NextResponse.json(
                { error: `AI confidence (${Math.round(confidence * 100)}%) is too low for automation sign-off.` },
                { status: 403 }
            );
        }

        const updatedDraft = {
            ...lead.outreachDraft,
            email: {
                ...lead.outreachDraft.email,
                status: 'approved',
                approvedAt: new Date().toISOString()
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
                type: 'outreach_draft_approved',
                description: 'Outreach draft was explicitly approved by a human.',
                metadata: {
                    approvedAt: updatedDraft.email.approvedAt,
                    subject: updatedDraft.email.subject
                }
            }
        });

        // TRIGGER SIMULATION (Milestone 2)
        const plan = createAutomationPlan(lead);
        await simulateAutomationExecution(plan);

        // Update automation status to simulated (Milestone 3)
        await prisma.lead.update({
            where: { id: params.id },
            data: { automationStatus: 'simulated' } as any
        });

        return NextResponse.json({ success: true, status: 'approved' });
    } catch (error: any) {
        console.error('Draft approval error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
