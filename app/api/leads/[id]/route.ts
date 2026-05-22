import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/leads/[id]
 * Fetch single lead with full details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: params.id },
            include: {
                activities: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ lead });
    } catch (error: any) {
        console.error('Lead fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/leads/[id]
 * Update lead fields
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json() as any;

        // Fetch existing lead state for comparison
        const existingLead = await prisma.lead.findUnique({
            where: { id: params.id }
        }) as any;

        if (!existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Define allowed update fields
        const allowedFields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'status', 'score', 'intent', 'notes', 'reviewStatus', 'outreachDraft'];
        const updateData: any = {};

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        // Update lead
        const lead = await prisma.lead.update({
            where: { id: params.id },
            data: updateData,
        });

        // AUDIT: Create activity log for manual overrides (score or intent)
        if (body.score !== undefined && body.score !== existingLead.score) {
            await prisma.activity.create({
                data: {
                    leadId: params.id,
                    type: 'manual_override',
                    description: `Score manually updated from ${existingLead.score} to ${body.score}`,
                    metadata: {
                        field: 'score',
                        before: existingLead.score,
                        after: body.score
                    }
                }
            });
        }

        if (body.intent !== undefined && body.intent !== existingLead.intent) {
            await prisma.activity.create({
                data: {
                    leadId: params.id,
                    type: 'manual_override',
                    description: `Intent manually updated from "${existingLead.intent}" to "${body.intent}"`,
                    metadata: {
                        field: 'intent',
                        before: existingLead.intent,
                        after: body.intent
                    }
                }
            });
        }

        // AUDIT: Create activity log for status change
        if (body.status && body.status !== existingLead.status) {
            await prisma.activity.create({
                data: {
                    leadId: params.id,
                    type: 'status_change',
                    description: `Status changed to ${body.status}`,
                },
            });
        }

        // AUDIT: Create activity log for review status change
        if (body.reviewStatus && body.reviewStatus !== existingLead.reviewStatus) {
            await prisma.activity.create({
                data: {
                    leadId: params.id,
                    type: 'review_status_change',
                    description: `AI Review Status updated to ${body.reviewStatus}`,
                    metadata: {
                        before: existingLead.reviewStatus,
                        after: body.reviewStatus
                    }
                },
            });
        }

        // AUDIT: Create activity log for notes
        if (body.notes && body.notes !== existingLead.notes) {
            await prisma.activity.create({
                data: {
                    leadId: params.id,
                    type: 'note',
                    description: `Note added/updated`,
                },
            });
        }

        return NextResponse.json({ lead });
    } catch (error: any) {
        console.error('Lead update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/leads/[id]
 * Delete lead
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.lead.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Lead deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
