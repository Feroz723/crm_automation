import { AIMetadata, OutreachDraft } from '../../types';
import { prisma } from '../../db';

/**
 * Result of the handshake validation.
 */
export interface HandshakeResult {
    isValid: boolean;
    missingGates: string[];
    isLiveMode: boolean;
    isShadowEligible: boolean;
}

/**
 * Mandatory 8-gate handshake validator.
 * This is the ultimate "Go/No-Go" logic for the automation engine.
 */
export async function validateOutreachHandshake(lead: any): Promise<HandshakeResult> {
    const missingGates: string[] = [];

    // --- TIERS 1-7: COMPLIANCE & SAFETY GATES ---
    // These must ALL pass for either SHADOW or LIVE mode.

    // GATE 1: Human Verification (Intelligence Verification)
    if (lead.reviewStatus !== 'verified') {
        missingGates.push('Human verification of AI insights');
    }

    // GATE 2: AI Confidence (Brain Integrity)
    const aiMeta = lead.aiMetadata as unknown as AIMetadata;
    if ((aiMeta?.confidence || 0) < 0.85) {
        missingGates.push(`High AI confidence (current: ${Math.round((aiMeta?.confidence || 0) * 100)}%)`);
    }

    // GATE 3: Approved Outreach Draft (Human Content Sign-off)
    const draft = lead.outreachDraft as unknown as OutreachDraft;
    if (!draft || draft.email.status !== 'approved') {
        missingGates.push('Explicit human approval of the outreach draft');
    }

    // GATE 4: Approved Automation Simulation (Human Sequence Sign-off)
    if (lead.automationStatus !== 'approved') {
        missingGates.push('Explicit human approval of the simulated sequence');
    }

    // GATE 5: Live Delivery Enablement (Environment Gate)
    const isLiveEnabled = process.env.LIVE_DELIVERY_ENABLED === 'true';
    if (!isLiveEnabled) {
        missingGates.push('Global LIVE_DELIVERY_ENABLED environment flag');
    }

    // GATE 6: Emergency Stop (Database-level Kill-Switch)
    try {
        const emergencyStop = await (prisma as any).systemConfig.findFirst({
            where: { key: 'EMERGENCY_STOP' }
        });

        if (emergencyStop?.value === 'true') {
            missingGates.push('Emergency Stop is currently ACTIVE in System Settings');
        }
    } catch (error) {
        console.error('Failed to check Emergency Stop status:', error);
        missingGates.push('Emergency Stop check failed (Safety Fallback)');
    }

    // GATE 7: Compliance Core (Consent & Rate Limiting)
    try {
        // 7a. Consent Check (Opt-Out)
        if (lead.email) {
            const optOut = await (prisma as any).optOut.findFirst({
                where: {
                    target: { equals: lead.email, mode: 'insensitive' },
                    channel: { in: ['EMAIL', 'ALL'] }
                }
            });

            if (optOut) {
                missingGates.push(`Blocked by Gate 7: Consent (Target ${lead.email} has opted out)`);
            }
        }

        // 7b. Rate Limit Check (Throttling)
        const dailyLimit = await (prisma as any).rateLimit.findFirst({
            where: { window: 'DAY' }
        });

        if (dailyLimit && dailyLimit.currentCount >= dailyLimit.maxCount) {
            missingGates.push(`Blocked by Gate 7: Rate Limit (Daily cap of ${dailyLimit.maxCount} reached)`);
        }

        const hourlyLimit = await (prisma as any).rateLimit.findFirst({
            where: { window: 'HOUR' }
        });

        if (hourlyLimit && hourlyLimit.currentCount >= hourlyLimit.maxCount) {
            missingGates.push(`Blocked by Gate 7: Rate Limit (Hourly cap of ${hourlyLimit.maxCount} reached)`);
        }

    } catch (error) {
        console.error('Failed to perform Compliance Gate 7 checks:', error);
        missingGates.push('Compliance Gate 7 check failed (Safety Fallback)');
    }

    // Determine Shadow Eligibility: All Gates 1-7 must pass.
    const isShadowEligible = missingGates.length === 0;

    // --- GATE 8: SAFE-SEND WHITELIST (Control Gate) ---
    // Only checked if all other safety/compliance gates pass.
    if (isShadowEligible && !lead.canReceiveLiveOutreach) {
        missingGates.push('Gate 8: Safe-Send Whitelist (Lead is not whitelisted for live delivery)');
    }

    return {
        isValid: missingGates.length === 0,
        missingGates,
        isLiveMode: isLiveEnabled,
        isShadowEligible
    };
}
