// Type definitions for Lead sources
export type LeadSource = 'facebook' | 'google_ads' | 'website' | 'manual' | 'whatsapp' | 'n8n';

// Type definitions for Lead status
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

// Type definitions for Review status (Phase 2.5)
export type ReviewStatus = 'unreviewed' | 'verified' | 'rejected';

// Type definitions for Activity types
export type ActivityType =
    | 'status_change'
    | 'email_sent'
    | 'ai_summary'
    | 'crm_sync'
    | 'note'
    | 'enrichment'
    | 'score_calculated'
    | 'ai_feedback'
    | 'manual_override'
    | 'review_status_change'
    | 'outreach_draft_generated'
    | 'outreach_draft_regenerated'
    | 'outreach_draft_approved'
    | 'outreach_draft_rejected'
    | 'automation_simulation'
    | 'automation_plan_approved'
    | 'automation_plan_rejected'
    | 'delivery_result';

export type AutomationStatus = 'not_simulated' | 'simulated' | 'approved' | 'rejected';

// Type definitions for User roles
export type UserRole = 'admin' | 'sales' | 'viewer';

// Webhook payload interface
export interface WebhookPayload {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    message?: string;
    source: LeadSource;
    [key: string]: any; // Allow additional fields
}

// AI metadata for explainability and tracking
export interface AIMetadata {
    scoringReasoning?: string;
    scoringFactors?: Record<string, number>;
    intentReasoning?: string;
    confidence?: number; // 0-1
    historicalContextUsed?: boolean;
}

// AI enrichment result
export interface EnrichmentResult {
    firstName?: string | null;
    lastName?: string | null;
    intent?: 'high' | 'medium' | 'low';
    intentReasoning?: string;
    category?: 'enterprise' | 'smb' | 'individual';
    interests?: string[];
    painPoints?: string[];
    nextAction?: string;
    nextActionReasoning?: string;
}

// Lead scoring result
export interface ScoringResult {
    score: number; // 0-100
    reasoning: string;
    confidence?: number;
    factors: {
        sourceQuality: number;
        contactCompleteness: number;
        messageQuality: number;
        urgencySignals: number;
        [key: string]: number;
    };
}

// Lead summary result
export interface LeadSummaryResult {
    summary: string;
    urgency: 'hot' | 'warm' | 'cold';
    objections: string[];
    strategy: string;
    timeline: string;
    talkingPoints: string[];
}

// Email generation result
export interface EmailVariant {
    subject: string;
    body: string;
    variant: 'initial' | 'followup' | 'reactivation';
}

export interface EmailGenerationResult {
    emails: EmailVariant[];
}

// Phase 3.0: Outreach Draft
export interface OutreachDraft {
    email: {
        subject: string;
        body: string;
        tone: 'formal' | 'friendly' | 'consultative';
        generatedAt: string;
        status: 'pending' | 'approved' | 'rejected';
        approvedAt?: string;
    };
}
