import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const SCENARIOS = {
    enterprise: {
        fullName: 'Jordan Sterling',
        email: 'j.sterling@globaltech-solutions.com',
        phone: '+1 (555) 012-9876',
        source: 'LinkedIn Enterprise Outreach',
        message: 'We are looking to overhaul our global CRM integration. We have 500+ seats and need a solution that scales with our AI-first initiative by Q3.',
        notes: 'High-value target. Focus on scalability and security.',
        status: 'new'
    },
    smb: {
        fullName: 'Alex Chen',
        email: 'alex@chen-consulting.net',
        phone: '+1 (555) 443-2211',
        source: 'Website Contact Form',
        message: 'Interested in seeing how AI can help automate some of my follow-ups. I currently manage about 50 leads a month.',
        notes: 'Small business owner. Needs simple automation first.',
        status: 'new'
    },
    junk: {
        fullName: 'John Doe',
        email: 'test12345@gmail.com',
        phone: '12345',
        source: 'Manual entry',
        message: 'hi',
        notes: 'Low quality/Incomplete data.',
        status: 'new'
    }
};

/**
 * POST /api/demo/generate
 * Creates a new lead based on a specific demo scenario.
 */
export async function POST(request: NextRequest) {
    try {
        const { scenario } = (await request.json()) as { scenario: keyof typeof SCENARIOS };

        if (!SCENARIOS[scenario]) {
            return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 });
        }

        const leadData = SCENARIOS[scenario];

        // 1. Create the lead
        const lead = await (prisma.lead as any).create({
            data: {
                ...leadData,
                reviewStatus: 'unreviewed',
                automationStatus: 'not_simulated'
            }
        });

        // 2. Log system event
        await prisma.activity.create({
            data: {
                leadId: lead.id,
                type: 'note',
                description: `Demo Scenario '${scenario.toUpperCase()}' generated for evaluation.`,
                metadata: { scenario, timestamp: new Date().toISOString() }
            }
        });

        return NextResponse.json({ success: true, leadId: lead.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
