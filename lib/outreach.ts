import { AIMetadata, OutreachDraft } from './types';

/**
 * Single source of truth for whether a lead is "ready for delivery".
 * To be ready, it must:
 * 1. Be human-verified (reviewStatus === 'verified')
 * 2. Have high AI confidence (>= 0.85)
 * 3. Have an APPROVED outreach draft
 */
export function isLeadReadyForOutreach(lead: any): {
    isReady: boolean;
    reason?: string;
    missing?: string[];
} {
    const missing: string[] = [];

    // Check 1: Human Verification
    if (lead.reviewStatus !== 'verified') {
        missing.push('Human verification of AI insights');
    }

    // Check 2: AI Confidence
    const aiMeta = lead.aiMetadata as unknown as AIMetadata;
    const confidence = aiMeta?.confidence || 0;
    if (confidence < 0.85) {
        missing.push(`High AI confidence (current: ${Math.round(confidence * 100)}%)`);
    }

    // Check 3: Approved Draft
    const draft = lead.outreachDraft as unknown as OutreachDraft;
    if (!draft || draft.email.status !== 'approved') {
        missing.push('Explicit human approval of the outreach draft');
    }

    const isReady = missing.length === 0;

    return {
        isReady,
        reason: isReady ? 'Lead is primed and ready for delivery.' : 'Lead is missing critical safety checks.',
        missing
    };
}
