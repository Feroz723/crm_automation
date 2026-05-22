import { prisma } from '../db';
import { AutomationPlan } from './planner';
import { ensureDryRunSafeguard } from './guards';
import { validateOutreachHandshake } from './delivery/validator';
import { EmailProvider } from './delivery/providers/email';
import { WhatsAppProvider } from './delivery/providers/whatsapp';
import { CRMProvider } from './delivery/providers/crm';
import { incrementRateLimit } from './delivery/rate-limiter';

// Provider Instances
const emailProvider = new EmailProvider();
const whatsappProvider = new WhatsAppProvider();
const crmProvider = new CRMProvider();

/**
 * Executes or Simulates an automation plan based on safety gates.
 */
export async function executeAutomationPlan(plan: AutomationPlan) {
    // Fetch latest lead state for handshake validation
    const lead = await prisma.lead.findUnique({
        where: { id: plan.leadId }
    });

    if (!lead) return;

    // Validate Safety Handshake
    const handshake = await validateOutreachHandshake(lead);

    console.log(`[ENGINE] Processing Plan for Lead ${plan.leadId}`);
    console.log(`[ENGINE] Handshake Result: ${handshake.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`[ENGINE] Shadow Eligibility: ${handshake.isShadowEligible ? 'YES' : 'NO'}`);

    for (const step of plan.steps) {
        // TIERED ROUTING LOGIC
        if (handshake.isLiveMode && handshake.isValid) {
            // TIER 1: LIVE EXECUTION (Whitelisted & Compliant)
            try {
                await executeLiveStep(plan.leadId, step, lead);
            } catch (error) {
                console.error(`[ENGINE] Live Step Failed, falling back to Shadow:`, error);
                await executeShadowStep(plan.leadId, step, lead);
            }
        } else if (handshake.isShadowEligible) {
            // TIER 2: SHADOW MODE (Compliant but not Whitelisted)
            await executeShadowStep(plan.leadId, step, lead);
        } else {
            // TIER 3: SIMULATION (Safety Fallback for Non-Compliant/Non-Verified)
            await simulateStep(plan.leadId, step);
        }
    }
}

/**
 * Old entry point for simulation only (Milestone 2 legacy support)
 */
export async function simulateAutomationExecution(plan: AutomationPlan) {
    for (const step of plan.steps) {
        await simulateStep(plan.leadId, step);
    }
}

async function simulateStep(leadId: string, step: any) {
    // Maintain dry-run safeguard at execution entry
    ensureDryRunSafeguard();

    const timestamp = new Date();
    const scheduledFor = new Date(timestamp.getTime() + (step.delayMinutes || 0) * 60000);

    await prisma.activity.create({
        data: {
            leadId,
            type: 'automation_simulation',
            description: `[SIMULATED] Planned ${step.action} via ${step.channel}`,
            metadata: {
                ...step,
                scheduledFor: scheduledFor.toISOString(),
                simulatedStatus: 'sent',
                payloadPreview: `Drafting content for ${step.channel}...`
            }
        }
    });
}

async function executeLiveStep(leadId: string, step: any, lead: any) {
    // This is where real side effects would happen if GATED
    let response;
    const payload = {
        recipient: lead.email || lead.phone || 'Unknown',
        subject: lead.outreachDraft?.email?.subject,
        body: lead.outreachDraft?.email?.body,
        metadata: { leadId }
    };

    switch (step.channel) {
        case 'email':
            response = await emailProvider.send(payload);
            break;
        case 'whatsapp':
            response = await whatsappProvider.send(payload);
            break;
        case 'crm':
            response = await crmProvider.send(payload);
            break;
        default:
            throw new Error(`Unsupported delivery channel: ${step.channel}`);
    }

    // Increment rate limits for successful sends
    if (response.success && lead.orgId) {
        await incrementRateLimit(lead.orgId, 'HOUR');
        await incrementRateLimit(lead.orgId, 'DAY');
    }

    // Log REAL activity
    await prisma.activity.create({
        data: {
            leadId,
            orgId: lead.orgId, // Ensure orgId is persisted
            type: step.action, // e.g., 'email_sent'
            description: `Successfully executed ${step.action} via ${step.channel}`,
            metadata: {
                ...step,
                providerResponse: response,
                executedAt: new Date().toISOString()
            }
        }
    });

    // Log CONSOLIDATED delivery result (Audit Trail Milestone 3)
    await prisma.activity.create({
        data: {
            leadId,
            orgId: lead.orgId, // Ensure orgId is persisted
            type: 'delivery_result',
            description: `Provider confirmed ${step.channel} delivery. ID: ${response.providerMessageId || 'N/A'}`,
            metadata: {
                channel: step.channel,
                status: response.success ? 'success' : 'failed',
                providerMessageId: response.providerMessageId,
                error: response.error,
                timestamp: response.timestamp,
                leadId
            }
        }
    });
}

async function executeShadowStep(leadId: string, step: any, lead: any) {
    const payload = {
        recipient: lead.email || lead.phone || 'Unknown',
        subject: lead.outreachDraft?.email?.subject,
        body: lead.outreachDraft?.email?.body,
        metadata: { leadId, mode: 'shadow' }
    };

    // 1. Persist to ShadowLog
    await (prisma as any).shadowLog.create({
        data: {
            orgId: lead.orgId || 'global-demo-org',
            leadId,
            channel: step.channel,
            action: step.action,
            payload: payload
        }
    });

    // 2. Log Shadow Activity
    await prisma.activity.create({
        data: {
            leadId,
            orgId: lead.orgId,
            type: 'shadow_execution',
            description: `[SHADOW] Validated ${step.action} via ${step.channel} (Safe-Send Blocked)`,
            metadata: {
                ...step,
                payload,
                executedAt: new Date().toISOString()
            }
        }
    });

    // 3. Track Rate Limits for higher fidelity simulation
    if (lead.orgId) {
        await incrementRateLimit(lead.orgId, 'HOUR');
        await incrementRateLimit(lead.orgId, 'DAY');
    }
}
