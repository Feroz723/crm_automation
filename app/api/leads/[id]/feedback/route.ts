import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/leads/[id]/feedback
 * Capture human feedback on specific AI insights
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = (await request.json()) as any;
        const { insightType, feedback, comment, originalValue, correctedValue } = body;

        // Validate required fields
        if (!insightType || !feedback) {
            return NextResponse.json(
                { error: 'insightType and feedback are required' },
                { status: 400 }
            );
        }

        // feedback should be 'correct' | 'incorrect' | 'adjusted'
        // insightType could be 'scoring', 'intent', 'summary', 'nextAction'

        // Log the feedback as an activity
        const activity = await prisma.activity.create({
            data: {
                leadId: params.id,
                type: 'ai_feedback',
                description: `Human feedback on AI ${insightType}: ${feedback.toUpperCase()}${comment ? ` - ${comment}` : ''}`,
                metadata: {
                    insightType,
                    feedback,
                    comment,
                    originalValue,
                    correctedValue,
                    timestamp: new Date().toISOString()
                }
            }
        });

        // Optionally, if the feedback is "incorrect" and a corrected value is provided,
        // we could trigger an internal state update, but for Phase 2.5 we primarily audit.

        return NextResponse.json({ success: true, activity });
    } catch (error: any) {
        console.error('Feedback submission error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
