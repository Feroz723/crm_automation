import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncToHubSpotWithRetry } from '@/lib/crm/hubspot';

/**
 * POST /api/crm/sync
 * Sync lead to external CRM (HubSpot)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as any;
        const { leadId } = body;

        if (!leadId) {
            return NextResponse.json(
                { error: 'Lead ID is required' },
                { status: 400 }
            );
        }

        // Fetch lead
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Sync to HubSpot
        const result = await syncToHubSpotWithRetry({
            email: lead.email || '',
            firstname: lead.firstName || undefined,
            lastname: lead.lastName || undefined,
            phone: lead.phone || undefined,
            lead_source: lead.source,
            lead_score: lead.score,
            lead_status: lead.status,
            notes: lead.notes || undefined,
        });

        // Log activity
        await prisma.activity.create({
            data: {
                leadId,
                type: 'crm_sync',
                description: result.success
                    ? `Successfully synced to HubSpot (Contact ID: ${result.contactId})`
                    : `Failed to sync to HubSpot: ${result.error}`,
                metadata: result,
            },
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Sync failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            contactId: result.contactId,
            message: 'Lead synced to HubSpot successfully',
        });
    } catch (error: any) {
        console.error('CRM sync error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
