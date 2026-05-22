/**
 * Cloudflare Worker for handling incoming lead webhooks
 * Endpoint: POST /api/lead/webhook
 * 
 * Flow:
 * 1. Validate payload
 * 2. Save raw payload to webhook_logs
 * 3. Normalize lead data
 * 4. Call AI enrichment
 * 5. Calculate lead score
 * 6. Save processed lead to database
 * 7. Create activity log
 * 8. Return success response
 */

interface Env {
    GROQ_API_KEY: string;
    GEMINI_API_KEY: string;
    DATABASE_URL: string;
}

interface WebhookPayload {
    source: string;
    full_name?: string;
    fullName?: string;
    name?: string;
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    message?: string;
    comments?: string;
    question?: string;
    [key: string]: any;
}

interface LeadData {
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    source: string;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle OPTIONS for CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only accept POST requests
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        try {
            // Parse incoming payload
            const payload = (await request.json()) as WebhookPayload;
            console.log('Received webhook payload:', payload);

            // Validate payload has minimum required fields
            if (!payload.source) {
                return new Response(
                    JSON.stringify({ error: 'Missing required field: source' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Log to webhook_logs table
            const webhookLogId = crypto.randomUUID();
            await logWebhook(env, webhookLogId, payload, 'pending');

            // Normalize lead data
            const leadData: LeadData = {
                fullName: payload.full_name || payload.fullName || payload.name || '',
                firstName: payload.first_name || payload.firstName || null,
                lastName: payload.last_name || payload.lastName || null,
                email: payload.email || null,
                phone: payload.phone || payload.phone_number || null,
                message: payload.message || payload.comments || payload.question || null,
                source: payload.source,
            };

            // Call AI enrichment (simplified for worker)
            const enrichmentResult = await enrichLeadSimple(leadData, env);

            // Calculate lead score
            const scoreResult = await calculateScoreSimple(leadData, env);

            // Save lead to database
            const leadId = crypto.randomUUID();
            const lead = {
                id: leadId,
                full_name: leadData.fullName,
                first_name: enrichmentResult.firstName || leadData.firstName,
                last_name: enrichmentResult.lastName || leadData.lastName,
                email: leadData.email,
                phone: leadData.phone,
                source: leadData.source,
                status: 'new',
                score: scoreResult.score,
                intent: enrichmentResult.intent,
                notes: leadData.message,
                raw_data: payload,
                ai_enriched: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await saveLead(env, lead);

            // Create activity log
            await createActivity(env, {
                id: crypto.randomUUID(),
                lead_id: leadId,
                type: 'enrichment',
                description: `Lead captured from ${leadData.source} and enriched with AI`,
                metadata: {
                    enrichment: enrichmentResult,
                    score: scoreResult,
                },
                created_at: new Date().toISOString(),
            });

            // Update webhook log status
            await updateWebhookLog(env, webhookLogId, 'success', leadId);

            return new Response(
                JSON.stringify({
                    success: true,
                    leadId,
                    score: scoreResult.score,
                    message: 'Lead processed successfully',
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        } catch (error: any) {
            console.error('Webhook processing error:', error);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message || 'Internal server error',
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }
    },
};

// Helper functions

async function logWebhook(env: Env, id: string, payload: WebhookPayload, status: string) {
    // In production, use Prisma or direct SQL
    console.log('Logging webhook:', id, status);
    // TODO: Implement database insert
}

async function updateWebhookLog(env: Env, id: string, status: string, leadId?: string) {
    console.log('Updating webhook log:', id, status, leadId);
    // TODO: Implement database update
}

async function saveLead(env: Env, lead: any) {
    console.log('Saving lead:', lead.id);
    // TODO: Implement database insert using Prisma or SQL
}

async function createActivity(env: Env, activity: any) {
    console.log('Creating activity:', activity.description);
    // TODO: Implement database insert
}

async function enrichLeadSimple(leadData: LeadData, env: Env) {
    // Simplified enrichment for worker
    const firstName = leadData.firstName || leadData.fullName?.split(' ')[0] || null;
    const lastName = leadData.lastName || leadData.fullName?.split(' ').slice(1).join(' ') || null;

    return {
        firstName,
        lastName,
        intent: 'medium',
        category: 'individual',
        interests: [],
        painPoints: [],
        nextAction: 'Follow up with initial outreach',
    };
}

async function calculateScoreSimple(leadData: LeadData, env: Env) {
    // Simplified scoring for worker
    let score = 50;

    if (leadData.source === 'facebook' || leadData.source === 'google_ads') score += 20;
    if (leadData.email) score += 10;
    if (leadData.phone) score += 10;
    if (leadData.message) score += 10;

    return {
        score: Math.min(100, score),
        reasoning: 'Basic scoring based on completeness',
    };
}
