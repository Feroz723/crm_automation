import { OutreachDraft } from '../types';

export interface AutomationStep {
    id: string;
    action: 'send_email' | 'send_whatsapp' | 'crm_sync';
    channel: 'email' | 'whatsapp' | 'crm';
    payload: any;
    scheduledFor: string;
    isDryRun: boolean;
}

export interface AutomationPlan {
    leadId: string;
    steps: AutomationStep[];
}

/**
 * Logic-heavy planner that decides the 'How' and 'When' of the outreach.
 */
export function createAutomationPlan(lead: any): AutomationPlan {
    const draft = lead.outreachDraft as unknown as OutreachDraft;
    const steps: AutomationStep[] = [];

    // Step 1: Simulated CRM Sync (Standard shadow step)
    steps.push({
        id: `step_1_${Date.now()}`,
        action: 'crm_sync',
        channel: 'crm',
        payload: { leadId: lead.id, status: 'outreach_planned' },
        scheduledFor: new Date().toISOString(),
        isDryRun: true
    });

    // Step 2: Adaptive Outreach Channel based on lead intelligence
    // LOGIC: High score leads get priority email, others get consultative WhatsApp (simulated)
    const action = lead.score >= 85 ? 'send_email' : 'send_whatsapp';

    steps.push({
        id: `step_2_${Date.now()}`,
        action,
        channel: action === 'send_email' ? 'email' : 'whatsapp',
        payload: {
            subject: draft.email.subject,
            body: draft.email.body,
            recipient: lead.email || lead.phone || 'Unknown'
        },
        scheduledFor: new Date(Date.now() + 1000 * 60).toISOString(), // Simulated 1-minute delay
        isDryRun: true
    });

    return {
        leadId: lead.id,
        steps
    };
}
