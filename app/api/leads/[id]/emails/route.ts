import { NextRequest, NextResponse } from 'next/server';
import { generateEmail } from '@/lib/ai/generateEmail';
import { prisma } from '@/lib/db';

/**
 * POST /api/leads/[id]/emails
 * Generate email variants for a lead
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch lead
        const lead = await prisma.lead.findUnique({
            where: { id: params.id },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Generate emails
        const result = await generateEmail({
            fullName: lead.fullName || undefined,
            firstName: lead.firstName || undefined,
            lastName: lead.lastName || undefined,
            email: lead.email || undefined,
            message: lead.notes || undefined,
            source: lead.source,
            intent: lead.intent || undefined,
        });

        // Log activity
        await prisma.activity.create({
            data: {
                leadId: params.id,
                type: 'email_sent',
                description: 'Generated email variants with AI',
                metadata: result,
            },
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Email generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
