import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/compliance/opt-out
 * Register a manual opt-out for an email or phone number.
 */
export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { target?: string, channel?: string, reason?: string };
        const { target, channel, reason } = body;

        if (!target || !channel) {
            return NextResponse.json(
                { error: 'Target and Channel are required' },
                { status: 400 }
            );
        }

        // Validate channel
        const validChannels = ['EMAIL', 'WHATSAPP', 'ALL'];
        if (!validChannels.includes(channel.toUpperCase())) {
            return NextResponse.json(
                { error: 'Invalid channel. Use EMAIL, WHATSAPP, or ALL' },
                { status: 400 }
            );
        }

        // Register the opt-out
        const optOut = await (prisma as any).optOut.upsert({
            where: {
                orgId_target_channel: {
                    orgId: 'global-demo-org', // In Phase 5.1/5.2, we use the default org
                    target: target.toLowerCase(),
                    channel: channel.toUpperCase()
                }
            },
            update: {
                reason: reason || 'Manual Opt-Out',
            },
            create: {
                target: target.toLowerCase(),
                channel: channel.toUpperCase(),
                reason: reason || 'Manual Opt-Out',
                orgId: 'global-demo-org'
            }
        });

        // Log compliance activity
        await (prisma as any).activity.create({
            data: {
                type: 'compliance_opt_out',
                description: `Target ${target} has opted out of ${channel} communications.`,
                metadata: {
                    target,
                    channel,
                    reason
                },
                orgId: 'global-demo-org'
            }
        });

        return NextResponse.json({
            success: true,
            optOut
        });

    } catch (error: any) {
        console.error('Compliance Opt-Out registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
