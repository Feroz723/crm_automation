import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/config
 * Fetch global system configurations.
 */
export async function GET() {
    try {
        const configs = await (prisma as any).systemConfig.findMany();
        const configMap = configs.reduce((acc: any, cfg: any) => {
            acc[cfg.key] = cfg.value;
            return acc;
        }, {});

        return NextResponse.json({ configs: configMap });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/config
 * Update or create a system configuration key.
 */
export async function POST(request: NextRequest) {
    try {
        const { key, value } = (await request.json()) as any;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const config = await (prisma as any).systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        // Log the change as a system event (Activity)
        await prisma.activity.create({
            data: {
                leadId: 'SYSTEM', // Special ID for global events
                type: 'system_config_change',
                description: `Global configuration '${key}' updated to '${value}'`,
                metadata: { key, newValue: value }
            }
        });

        return NextResponse.json({ success: true, config });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
